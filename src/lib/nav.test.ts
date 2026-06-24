import { describe, it, expect } from 'vitest';
import { canAccess, permissionForPath } from './nav';

describe('permissionForPath', () => {
  it('maps pages to their required permission (longest-prefix)', () => {
    expect(permissionForPath('/staff')).toBe('staff');
    expect(permissionForPath('/pos')).toBe('pos');
    expect(permissionForPath('/inventory')).toBe('inventory');
    expect(permissionForPath('/dashboard')).toBeNull(); // open to all
    expect(permissionForPath('/settings')).toBe('settings');
  });
});

describe('canAccess (role gating)', () => {
  it('lets SUPER_ADMIN reach everything', () => {
    expect(canAccess('SUPER_ADMIN', permissionForPath('/staff'))).toBe(true);
    expect(canAccess('SUPER_ADMIN', permissionForPath('/reports'))).toBe(true);
    expect(canAccess('SUPER_ADMIN', permissionForPath('/settings'))).toBe(true);
  });

  it('restricts a CASHIER to their areas', () => {
    expect(canAccess('CASHIER', permissionForPath('/pos'))).toBe(true);
    expect(canAccess('CASHIER', permissionForPath('/customers'))).toBe(true);
    expect(canAccess('CASHIER', permissionForPath('/staff'))).toBe(false);
    expect(canAccess('CASHIER', permissionForPath('/inventory'))).toBe(false);
    expect(canAccess('CASHIER', permissionForPath('/reports'))).toBe(false);
    expect(canAccess('CASHIER', permissionForPath('/settings'))).toBe(false);
  });

  it('keeps settings limited to SUPER_ADMIN', () => {
    for (const role of ['MANAGER', 'CASHIER', 'STOCK_KEEPER', 'SALES_REP']) {
      expect(canAccess(role, permissionForPath('/settings'))).toBe(false);
    }
  });

  it('keeps the dashboard open to every role', () => {
    for (const role of ['CASHIER', 'STOCK_KEEPER', 'SALES_REP', 'MANAGER']) {
      expect(canAccess(role, permissionForPath('/dashboard'))).toBe(true);
    }
  });
});
