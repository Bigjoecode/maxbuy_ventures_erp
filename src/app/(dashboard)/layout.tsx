'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/apiClient';
import { canAccess, permissionForPath } from '@/lib/nav';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useAuthStore((s) => s.setUser);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    // Validates the session against the server (httpOnly cookie). apiFetch
    // handles silent refresh and redirects to /login if there is no session.
    apiFetch<{ user: any }>('/api/auth/me')
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        // Role-based route guard: bounce to the dashboard if this role can't
        // access the current page (defence-in-depth on top of API permissions).
        if (!canAccess(data.user?.role, permissionForPath(pathname))) {
          router.replace('/dashboard');
          return;
        }
        setChecked(true);
      })
      .catch(() => {
        /* apiFetch already redirected to /login on auth failure */
      });
    return () => {
      active = false;
    };
  }, [setUser, pathname, router]);

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--green)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar badgeCounts={{ expiry: 3, debts: 5 }} />
      <div className="flex flex-1 flex-col md:ml-[240px]">
        <OfflineBanner />
        {/* pb on mobile so content clears the bottom tab bar */}
        <div className="flex flex-1 flex-col pb-16 md:pb-0">{children}</div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
