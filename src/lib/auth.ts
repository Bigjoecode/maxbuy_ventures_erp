import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthTokenPayload {
  staffId: string;
  username: string;
  role: string;
  branchId?: string | null;
}

export function signToken(payload: AuthTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
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
