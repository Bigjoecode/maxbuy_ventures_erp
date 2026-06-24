import { describe, it, expect } from 'vitest';
import { branchScope } from './branch';

const base = { staffId: 's1', username: 'u', role: 'CASHIER' as string };

describe('branchScope', () => {
  it('returns no filter for SUPER_ADMIN (sees all branches)', () => {
    expect(branchScope({ ...base, role: 'SUPER_ADMIN', branchId: 'b1' })).toEqual({});
  });

  it('returns no filter when the user has no branch assigned', () => {
    expect(branchScope({ ...base, branchId: null })).toEqual({});
  });

  it('scopes a branch-assigned non-admin to their branch', () => {
    expect(branchScope({ ...base, branchId: 'b1' })).toEqual({ branchId: 'b1' });
  });
});
