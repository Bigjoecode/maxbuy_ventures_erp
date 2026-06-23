import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOtp, hashOtp, OTP_TTL_MS } from '@/lib/otp';
import { sendSms } from '@/lib/notify';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { z } from 'zod';

const schema = z.object({ username: z.string().min(1) });

// Always returns the same generic response so attackers can't enumerate which
// usernames exist.
const GENERIC = {
  message: 'If an account exists, a reset code has been sent to its registered phone number.',
};

export async function POST(req: NextRequest) {
  const limit = rateLimit(`forgot:${clientIp(req)}`, 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({ where: { username: parsed.data.username } });

  if (staff && staff.isActive && staff.phone) {
    // Invalidate any prior unconsumed codes for this user.
    await prisma.passwordResetOtp.updateMany({
      where: { staffId: staff.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = generateOtp();
    await prisma.passwordResetOtp.create({
      data: {
        staffId: staff.id,
        codeHash: hashOtp(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await sendSms(
      staff.phone,
      `Your Maxbuy Ventures password reset code is ${code}. It expires in 10 minutes. If you did not request this, ignore this message.`
    );
  }

  return NextResponse.json(GENERIC);
}
