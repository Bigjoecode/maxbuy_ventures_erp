'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // The dashboard layout re-validates the session against the server cookie;
    // this is just an initial hint to avoid a needless bounce through /login.
    router.replace(user ? '/dashboard' : '/login');
  }, [user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
      <div className="flex items-center gap-3 text-[var(--text-muted)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--green)] border-t-transparent" />
        <span className="font-display text-sm">Loading Maxbuy Ventures...</span>
      </div>
    </div>
  );
}
