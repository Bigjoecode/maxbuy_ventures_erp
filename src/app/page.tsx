'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    router.replace(token ? '/dashboard' : '/login');
  }, [token, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
      <div className="flex items-center gap-3 text-[var(--text-muted)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--green)] border-t-transparent" />
        <span className="font-display text-sm">Loading Maxbuy Ventures...</span>
      </div>
    </div>
  );
}
