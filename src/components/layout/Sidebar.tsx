'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store/authStore';
import { NAV_SECTIONS, canAccess } from '@/lib/nav';
import { cn } from '@/lib/utils';

interface SidebarProps {
  badgeCounts?: Record<string, number>;
}

export function Sidebar({ badgeCounts = {} }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUIStore();

  // Only show sections/items the current role is allowed to access.
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccess(user?.role, item.permission)),
  })).filter((section) => section.items.length > 0);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* clear client state regardless of network result */
    }
    logout();
    router.push('/login');
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[99] bg-black/40 md:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-[100] flex h-screen w-[240px] flex-col overflow-y-auto bg-[var(--sidebar-bg)] transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="relative border-b border-white/[0.06] px-5 pt-6 pb-4">
          {/* Close button — mobile only */}
          <button
            onClick={closeSidebar}
            aria-label="Close menu"
            className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
          <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--green-mid)] text-lg">
            🛒
          </div>
          <h1 className="font-display text-[17px] font-extrabold leading-tight text-white">Maxbuy Ventures</h1>
          <span className="text-[10px] font-medium uppercase tracking-[2px] text-[var(--green-mid)]">
            Business System
          </span>
        </div>

        <nav className="flex-1 py-3">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-white/20">
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                const Icon = item.icon;
                const badgeCount = item.badge ? badgeCounts[item.badge] : undefined;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={cn(
                      'flex items-center gap-2.5 border-l-[3px] border-transparent px-4 py-2.5 text-[13px] text-[var(--sidebar-text)] transition-colors hover:bg-white/[0.04] hover:text-white',
                      isActive && 'border-l-[var(--green-mid)] bg-[var(--green-mid)]/[0.12] font-medium text-[var(--green-mid)]'
                    )}
                  >
                    <Icon size={15} className="w-[18px]" />
                    {item.label}
                    {!!badgeCount && (
                      <span className="ml-auto rounded-full bg-[var(--red)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[var(--green-mid)] font-display text-[13px] font-bold text-white">
              {user?.avatar || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.name || 'User'}</p>
              <span className="text-[10px] text-[var(--sidebar-text)]">{user?.role || ''}</span>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-[13px] text-white/50 hover:text-white">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
