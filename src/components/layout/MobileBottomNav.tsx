'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Boxes, Users, Menu, LucideIcon } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store/authStore';
import { canAccess } from '@/lib/nav';
import { cn } from '@/lib/utils';

interface QuickItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string | null;
}

const QUICK: QuickItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, permission: 'dashboard' },
  { href: '/pos', label: 'POS', icon: ShoppingCart, permission: 'pos' },
  { href: '/inventory', label: 'Stock', icon: Boxes, permission: 'inventory' },
  { href: '/customers', label: 'Customers', icon: Users, permission: 'customers' },
];

// Bottom tab bar for quick access on mobile (the full menu is the side drawer,
// opened via "More"). Hidden on md+ where the sidebar is always visible.
export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const items = QUICK.filter((i) => canAccess(user?.role, i.permission)).slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] flex items-stretch border-t border-[var(--border)] bg-[var(--card)] md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
              active ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'
            )}
          >
            <Icon size={19} />
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={toggleSidebar}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-[var(--text-muted)]"
        aria-label="Open menu"
      >
        <Menu size={19} />
        More
      </button>
    </nav>
  );
}
