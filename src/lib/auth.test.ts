import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  signAccessToken,
  verifyToken,
  hashRefreshSecret,
  generateRefreshSecret,
} from './auth';

describe('hasPermission (RBAC)', () => {
  it('grants SUPER_ADMIN everything via wildcard', () => {
    expect(hasPermission('SUPER_ADMIN', 'staff')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'anything')).toBe(true);
  });

  it('enforces scoped permissions for a CASHIER', () => {
    expect(hasPermission('CASHIER', 'pos')).toBe(true);
    expect(hasPermission('CASHIER', 'inventory')).toBe(false);
  });

  it('denies unknown roles', () => {
    expect(hasPermission('GHOST', 'pos')).toBe(false);
  });
});

describe('access token', () => {
  it('round-trips the payload through sign/verify', () => {
    const token = signAccessToken({ staffId: 's1', username: 'admin', role: 'SUPER_ADMIN', branchId: 'b1' });
    const decoded = verifyToken(token);
    expect(decoded?.staffId).toBe('s1');
    expect(decoded?.role).toBe('SUPER_ADMIN');
  });

  it('rejects a tampered/garbage token', () => {
    expect(verifyToken('not-a-real-token')).toBeNull();
  });
});

describe('refresh secrets', () => {
  it('hashes deterministically (sha-256 hex) and not as plaintext', () => {
    const raw = generateRefreshSecret();
    expect(hashRefreshSecret(raw)).toBe(hashRefreshSecret(raw));
    expect(hashRefreshSecret(raw)).not.toBe(raw);
    expect(hashRefreshSecret(raw)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates unique secrets', () => {
    const a = generateRefreshSecret();
    const b = generateRefreshSecret();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43); // 32 bytes base64url ≈ 43 chars
  });
});
