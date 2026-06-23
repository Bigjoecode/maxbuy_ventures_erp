import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AuthTokenPayload, hasPermission, ACCESS_COOKIE } from './auth';

/**
 * Extracts and verifies the access token. Prefers the httpOnly cookie set at
 * login; falls back to an Authorization: Bearer header for non-browser API
 * clients. Returns the decoded payload, or null if missing/invalid.
 */
export function getAuthFromRequest(req: NextRequest): AuthTokenPayload | null {
  const cookieToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (cookieToken) {
    const payload = verifyToken(cookieToken);
    if (payload) return payload;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return verifyToken(authHeader.slice('Bearer '.length));
  }

  return null;
}

/**
 * Use at the top of any protected API route:
 *
 *   const auth = requireAuth(req);
 *   if (auth instanceof NextResponse) return auth; // unauthorized response
 *
 * Optionally pass a permission key (matches PERMISSIONS map in auth.ts).
 */
export function requireAuth(req: NextRequest, permission?: string): AuthTokenPayload | NextResponse {
  const auth = getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (permission && !hasPermission(auth.role, permission)) {
    return NextResponse.json({ error: 'Forbidden — insufficient permissions' }, { status: 403 });
  }
  return auth;
}
