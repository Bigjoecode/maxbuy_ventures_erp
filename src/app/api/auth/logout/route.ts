import { NextRequest, NextResponse } from 'next/server';
import { REFRESH_COOKIE } from '@/lib/auth';
import { revokeSession } from '@/lib/session';
import { clearAuthCookies } from '@/lib/authCookies';

export async function POST(req: NextRequest) {
  const refreshCookie = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshCookie) {
    await revokeSession(refreshCookie);
  }
  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
