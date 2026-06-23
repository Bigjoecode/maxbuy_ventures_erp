import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signAccessToken } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { setAuthCookies } from '@/lib/authCookies';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const staff = await prisma.staff.findUnique({ where: { username } });

    if (!staff || !staff.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await comparePassword(password, staff.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = signAccessToken({
      staffId: staff.id,
      username: staff.username,
      role: staff.role,
      branchId: staff.branchId,
    });
    const { refreshCookieValue, refreshExpiresAt } = await createSession(staff.id, req);

    await prisma.staff.update({ where: { id: staff.id }, data: { lastActiveAt: new Date() } });
    await prisma.activityLog.create({
      data: { staffId: staff.id, action: 'LOGIN', details: `${staff.username} logged in` },
    });

    const initials = staff.name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const res = NextResponse.json({
      user: {
        staffId: staff.id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        avatar: initials,
      },
    });
    setAuthCookies(res, accessToken, refreshCookieValue, refreshExpiresAt);
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
