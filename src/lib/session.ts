import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import {
  AuthTokenPayload,
  REFRESH_TOKEN_TTL_DAYS,
  generateRefreshSecret,
  hashRefreshSecret,
} from './auth';

// The refresh cookie carries "<sessionId>.<rawSecret>". The session id lets us
// look the row up directly; the secret is verified against the stored hash.
function buildCookieValue(sessionId: string, rawSecret: string): string {
  return `${sessionId}.${rawSecret}`;
}

function parseCookieValue(value: string): { sessionId: string; rawSecret: string } | null {
  const idx = value.indexOf('.');
  if (idx <= 0) return null;
  return { sessionId: value.slice(0, idx), rawSecret: value.slice(idx + 1) };
}

function requestMeta(req: NextRequest): { userAgent: string | null; ipAddress: string | null } {
  const userAgent = req.headers.get('user-agent');
  const fwd = req.headers.get('x-forwarded-for');
  const ipAddress = fwd ? fwd.split(',')[0].trim() : null;
  return { userAgent: userAgent?.slice(0, 255) ?? null, ipAddress };
}

function expiryFromNow(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Creates a new session and returns the refresh cookie value to set. */
export async function createSession(
  staffId: string,
  req: NextRequest
): Promise<{ refreshCookieValue: string; refreshExpiresAt: Date }> {
  const rawSecret = generateRefreshSecret();
  const expiresAt = expiryFromNow();
  const { userAgent, ipAddress } = requestMeta(req);

  const session = await prisma.session.create({
    data: { staffId, tokenHash: hashRefreshSecret(rawSecret), userAgent, ipAddress, expiresAt },
  });

  return { refreshCookieValue: buildCookieValue(session.id, rawSecret), refreshExpiresAt: expiresAt };
}

export interface RotateResult {
  payload: AuthTokenPayload;
  refreshCookieValue: string;
  refreshExpiresAt: Date;
}

/**
 * Validates a refresh cookie and rotates it. Returns a fresh access-token
 * payload + new refresh cookie, or null if the session is invalid/expired/
 * revoked, or the staff account is gone or deactivated.
 */
export async function rotateSession(
  refreshCookieValue: string,
  req: NextRequest
): Promise<RotateResult | null> {
  const parsed = parseCookieValue(refreshCookieValue);
  if (!parsed) return null;

  const session = await prisma.session.findUnique({
    where: { id: parsed.sessionId },
    include: { staff: true },
  });

  if (!session) return null;

  // Reuse / tampering: a presented secret that doesn't match the stored hash
  // for a live session is treated as compromise — revoke it.
  const presentedHash = hashRefreshSecret(parsed.rawSecret);
  if (presentedHash !== session.tokenHash) {
    if (!session.revokedAt) {
      await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    }
    return null;
  }

  if (session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.staff || !session.staff.isActive) return null;

  // Rotate: issue a new secret + sliding expiry on the same session row.
  const newSecret = generateRefreshSecret();
  const newExpiry = expiryFromNow();
  const { ipAddress } = requestMeta(req);
  await prisma.session.update({
    where: { id: session.id },
    data: { tokenHash: hashRefreshSecret(newSecret), expiresAt: newExpiry, lastUsedAt: new Date(), ipAddress },
  });

  return {
    payload: {
      staffId: session.staff.id,
      username: session.staff.username,
      role: session.staff.role,
      branchId: session.staff.branchId,
    },
    refreshCookieValue: buildCookieValue(session.id, newSecret),
    refreshExpiresAt: newExpiry,
  };
}

/** Revokes the session referenced by a refresh cookie (logout). */
export async function revokeSession(refreshCookieValue: string): Promise<void> {
  const parsed = parseCookieValue(refreshCookieValue);
  if (!parsed) return;
  await prisma.session
    .updateMany({
      where: { id: parsed.sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => undefined);
}
