import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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

export interface AuthTokenPayload {
  staffId: string;
  username: string;
  role: string;
  branchId?: string | null;
}

export function signToken(payload: AuthTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}

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
