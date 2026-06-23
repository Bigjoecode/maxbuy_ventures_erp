import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth';

const isProd = process.env.NODE_ENV === 'production';

// Access cookie lives a bit longer than the token itself so an expired token
// still reaches the server (which then returns 401 and triggers a refresh).
const ACCESS_COOKIE_MAX_AGE = 60 * 30; // 30 minutes

const baseOptions = {
  httpOnly: true,
  secure: isProd, // HTTPS-only in production; allows http://localhost in dev
  sameSite: 'lax' as const, // mitigates CSRF on cross-site navigations
  path: '/',
};

/** Sets the access + refresh cookies on a response. */
export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
  refreshExpiresAt: Date
): void {
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    ...baseOptions,
    // The refresh cookie is only ever sent to the refresh/logout endpoints.
    path: '/api/auth',
    expires: refreshExpiresAt,
  });
}

/** Clears both auth cookies (logout / invalid session). */
export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, '', { ...baseOptions, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { ...baseOptions, path: '/api/auth', maxAge: 0 });
}
