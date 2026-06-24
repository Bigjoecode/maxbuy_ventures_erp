import { AuthTokenPayload } from './auth';

/**
 * Returns a Prisma `where` fragment that scopes a query to the caller's branch.
 *
 * Backward-compatible by design (the system is single-branch today and should
 * stay fully working): SUPER_ADMIN sees every branch, and a user with no branch
 * assigned also sees everything. Branch-assigned non-admins are limited to their
 * own branch — the foundation for multi-branch operation without a redesign.
 */
export function branchScope(auth: AuthTokenPayload): { branchId?: string } {
  if (auth.role === 'SUPER_ADMIN') return {};
  if (!auth.branchId) return {};
  return { branchId: auth.branchId };
}
