import {
  LayoutDashboard, ShoppingCart, Boxes, Truck, CalendarX, Receipt, Wallet,
  HandCoins, Users, Star, UserCog, Building2, BarChart3, ScrollText, Trash2,
  Bot, Settings, LucideIcon,
} from 'lucide-react';
import { hasPermission } from './permissions';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Permission key required to see/use this item; null = available to all roles. */
  permission: string | null;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
      { href: '/pos', label: 'Point of Sale', icon: ShoppingCart, permission: 'pos' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { href: '/inventory', label: 'Products & Stock', icon: Boxes, permission: 'inventory' },
      { href: '/suppliers', label: 'Suppliers', icon: Truck, permission: 'suppliers' },
      { href: '/expiry', label: 'Expiry Tracker', icon: CalendarX, permission: 'expiry', badge: 'expiry' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/sales', label: 'Sales & Invoices', icon: Receipt, permission: 'sales' },
      { href: '/expenses', label: 'Expenses', icon: Wallet, permission: 'expenses' },
      { href: '/debts', label: 'Debts & Credits', icon: HandCoins, permission: 'debts', badge: 'debts' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { href: '/customers', label: 'Customers', icon: Users, permission: 'customers' },
      { href: '/loyalty', label: 'Loyalty Program', icon: Star, permission: 'customers' },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/staff', label: 'Staff & Roles', icon: UserCog, permission: 'staff' },
      { href: '/branches', label: 'Branches', icon: Building2, permission: 'inventory' },
      { href: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports' },
      { href: '/activity-log', label: 'Activity Log', icon: ScrollText, permission: 'reports' },
      { href: '/recycle-bin', label: 'Recycle Bin', icon: Trash2, permission: 'reports' },
      { href: '/ai-assistant', label: 'AI Assistant', icon: Bot, permission: 'reports' },
      { href: '/settings', label: 'Settings', icon: Settings, permission: 'settings' },
    ],
  },
];

export function canAccess(role: string | undefined | null, permission: string | null): boolean {
  if (permission === null) return true;
  return hasPermission(role, permission);
}

// First page this role is allowed to land on. Super admins get the dashboard;
// every other role gets the first nav item they can access (e.g. a cashier
// lands on POS). Used as the post-login redirect and the route-guard fallback.
export function firstAccessiblePath(role: string | undefined | null): string {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (canAccess(role, item.permission)) return item.href;
    }
  }
  return '/dashboard';
}

// Map a pathname to the permission its page requires (longest-prefix match).
export function permissionForPath(pathname: string): string | null {
  let match: NavItem | undefined;
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        if (!match || item.href.length > match.href.length) match = item;
      }
    }
  }
  return match ? match.permission : null; // unknown paths default to allowed
}
