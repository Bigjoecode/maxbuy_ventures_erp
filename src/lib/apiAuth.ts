import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AuthTokenPayload, hasPermission } from './auth';

/**
 * Extracts and verifies the bearer token from the Authorization header.
 * Returns the decoded payload, or null if missing/invalid.
 */
export function getAuthFromRequest(req: NextRequest): AuthTokenPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  return verifyToken(token);
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
