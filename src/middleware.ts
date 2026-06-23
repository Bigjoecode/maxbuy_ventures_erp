import { NextRequest, NextResponse } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF defense-in-depth for cookie-authenticated mutations.
 *
 * Our auth cookies are SameSite=Lax, which already blocks them from being sent
 * on cross-site sub-requests. As a second layer, we reject mutating /api
 * requests whose Origin header doesn't match the host. Requests with no Origin
 * (e.g. non-browser API clients using a Bearer token, which aren't cookie-CSRF
 * susceptible) are allowed through.
 */
export function middleware(req: NextRequest) {
  if (MUTATING_METHODS.has(req.method)) {
    const origin = req.headers.get('origin');
    if (origin) {
      const host = req.headers.get('host');
      let originHost = '';
      try {
        originHost = new URL(origin).host;
      } catch {
        originHost = '';
      }
      if (!host || originHost !== host) {
        return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
