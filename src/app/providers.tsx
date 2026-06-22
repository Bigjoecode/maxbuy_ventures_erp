'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useUIStore } from '@/store/authStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const darkMode = useUIStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <>
      {children}
      <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', fontSize: '13px' } }} />
    </>
  );
}
