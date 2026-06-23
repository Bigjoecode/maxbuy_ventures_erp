import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { hashOtp, OTP_MAX_ATTEMPTS } from '@/lib/otp';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const INVALID = { error: 'Invalid or expired reset code.' };

export async function POST(req: NextRequest) {
  const limit = rateLimit(`reset:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { username, code, newPassword } = parsed.data;

  const staff = await prisma.staff.findUnique({ where: { username } });
  if (!staff || !staff.isActive) {
    return NextResponse.json(INVALID, { status: 400 });
  }

  const otp = await prisma.passwordResetOtp.findFirst({
    where: { staffId: staff.id, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp || otp.expiresAt < new Date()) {
    return NextResponse.json(INVALID, { status: 400 });
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.passwordResetOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
    return NextResponse.json(
      { error: 'Too many incorrect attempts. Please request a new code.' },
      { status: 400 }
    );
  }

  if (hashOtp(code) !== otp.codeHash) {
    await prisma.passwordResetOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json(INVALID, { status: 400 });
  }

  // Success: update password, consume the code, and revoke all existing
  // sessions so a compromised account is fully reset everywhere.
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.staff.update({ where: { id: staff.id }, data: { passwordHash } }),
    prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.session.updateMany({
      where: { staffId: staff.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.activityLog.create({
      data: { staffId: staff.id, action: 'PASSWORD_RESET', details: `${staff.username} reset their password` },
    }),
  ]);

  return NextResponse.json({ ok: true, message: 'Password reset successful. Please log in.' });
}
