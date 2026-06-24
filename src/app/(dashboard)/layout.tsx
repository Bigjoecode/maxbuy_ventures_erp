'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/apiClient';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    // Validates the session against the server (httpOnly cookie). apiFetch
    // handles silent refresh and redirects to /login if there is no session.
    apiFetch<{ user: any }>('/api/auth/me')
      .then((data) => {
        if (active) {
          setUser(data.user);
          setChecked(true);
        }
      })
      .catch(() => {
        /* apiFetch already redirected to /login on auth failure */
      });
    return () => {
      active = false;
    };
  }, [setUser]);

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
        {children}
      </div>
    </div>
  );
}
