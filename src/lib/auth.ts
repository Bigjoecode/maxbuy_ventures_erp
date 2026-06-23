import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Access token is short-lived; the refresh token (stored as a revocable DB
// session) is what keeps the user signed in. See src/lib/session.ts.
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
export const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);

// httpOnly cookie names
export const ACCESS_COOKIE = 'mb_access';
export const REFRESH_COOKIE = 'mb_refresh';

export interface AuthTokenPayload {
  staffId: string;
  username: string;
  role: string;
  branchId?: string | null;
}

/**
 * Resolves the JWT signing secret. Fails fast in production if it is missing
 * or too weak — never falls back to a hardcoded secret in a live deployment.
 * In development a clearly-flagged insecure fallback is allowed for convenience.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is missing or shorter than 32 characters. Refusing to sign/verify tokens in production. ' +
        'Set a strong JWT_SECRET in the environment.'
    );
  }

  console.warn(
    '[auth] JWT_SECRET is missing or weak — using an INSECURE development-only fallback. ' +
      'Set a 32+ character JWT_SECRET in .env before deploying.'
  );
  return secret || 'dev-only-insecure-secret-change-me-32+chars';
}

/** Signs a short-lived access token (carried in an httpOnly cookie). */
export function signAccessToken(payload: AuthTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}

// --- Refresh tokens -------------------------------------------------------
// The refresh token is an opaque random secret. Only its SHA-256 hash is
// stored (in the Session row), so a database leak cannot be used to forge
// sessions. Rotation on every refresh lets us detect token reuse.

export function generateRefreshSecret(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashRefreshSecret(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// --- Passwords ------------------------------------------------------------

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Role-based permission map.
 * Extend this as the ERP grows (e.g. add 'reports:export', 'staff:manage').
 */
export const PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  MANAGER: ['pos', 'inventory', 'sales', 'expenses', 'debts', 'customers', 'reports', 'suppliers'],
  CASHIER: ['pos', 'sales', 'customers'],
  STOCK_KEEPER: ['inventory', 'suppliers', 'expiry'],
  SALES_REP: ['pos', 'customers', 'debts'],
};

export function hasPermission(role: string, permission: string): boolean {
  const perms = PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}
