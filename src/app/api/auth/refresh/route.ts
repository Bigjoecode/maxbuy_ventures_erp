import { NextRequest, NextResponse } from 'next/server';
import { signAccessToken, REFRESH_COOKIE } from '@/lib/auth';
import { rotateSession } from '@/lib/session';
import { setAuthCookies, clearAuthCookies } from '@/lib/authCookies';

// Exchanges a valid refresh cookie for a new access token, rotating the
// refresh token. Returns 401 (and clears cookies) if the session is invalid.
export async function POST(req: NextRequest) {
  const refreshCookie = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshCookie) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  const rotated = await rotateSession(refreshCookie, req);
  if (!rotated) {
    const res = NextResponse.json({ error: 'Session expired' }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const accessToken = signAccessToken(rotated.payload);
  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, accessToken, rotated.refreshCookieValue, rotated.refreshExpiresAt);
  return res;
}
