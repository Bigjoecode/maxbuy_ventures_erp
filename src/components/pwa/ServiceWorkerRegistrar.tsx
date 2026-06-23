'use client';

import { useEffect } from 'react';

// Registers the service worker and bridges its Background-Sync message to the
// app's sync engine (dispatched as a window event the sync hook listens for).
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV === 'development') return; // avoid SW caching during dev

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_SALES') {
        window.dispatchEvent(new Event('maxbuy:sync-sales'));
      }
    };

    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('SW registration failed:', err));
    navigator.serviceWorker.addEventListener('message', onMessage);

    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  return null;
}
