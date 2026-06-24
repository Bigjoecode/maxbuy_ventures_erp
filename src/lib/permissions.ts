// Client-safe RBAC map (no Node-only imports, so it can be used in the browser
// to filter navigation and guard routes). The server enforces the same map.

export const PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  MANAGER: ['pos', 'inventory', 'sales', 'expenses', 'debts', 'customers', 'reports', 'suppliers'],
  CASHIER: ['pos', 'sales', 'customers'],
  STOCK_KEEPER: ['inventory', 'suppliers', 'expiry'],
  SALES_REP: ['pos', 'customers', 'debts'],
};

export function hasPermission(role: string | undefined | null, permission: string): boolean {
  if (!role) return false;
  const perms = PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}
