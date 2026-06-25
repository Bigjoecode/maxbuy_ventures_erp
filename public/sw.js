/* Maxbuy Ventures service worker — offline app shell + static caching.
 * Data (products, customers, queued sales) is handled in the app via IndexedDB
 * (Dexie), NOT here, so this SW deliberately ignores /api requests and never
 * caches mutations. */
const VERSION = 'v2';
const STATIC_CACHE = `maxbuy-static-${VERSION}`;
const PAGE_CACHE = `maxbuy-pages-${VERSION}`;
const OFFLINE_URL = '/offline';

// Core routes precached on install so navigating to them works offline even if
// the user never visited them online. The HTML shell loads; data comes from
// IndexedDB (Dexie) inside the app.
const CORE_ROUTES = [
  OFFLINE_URL,
  '/dashboard',
  '/pos',
  '/inventory',
  '/sales',
  '/customers',
  '/expenses',
  '/debts',
  '/expiry',
  '/loyalty',
  '/suppliers',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      // Best-effort: cache each route individually so one failure (e.g. an
      // auth-gated redirect) doesn't abort the whole precache.
      await Promise.all(CORE_ROUTES.map((url) => cache.add(url).catch(() => {})));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:css|js|png|jpg|jpeg|gif|svg|webp|woff2?|ico)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never cache mutations
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let the browser handle CDN assets
  if (url.pathname.startsWith('/api/')) return; // data layer owns these (Dexie)

  // Static assets: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })()
    );
    return;
  }

  // Page navigations: network-first, fall back to cached page, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(PAGE_CACHE);
          cache.put(request, res.clone());
          return res;
        } catch {
          const cache = await caches.open(PAGE_CACHE);
          return (await cache.match(request)) || (await cache.match(OFFLINE_URL)) || Response.error();
        }
      })()
    );
  }
});

// Web Push handlers — push-ready. Sending pushes from the server still needs
// VAPID keys + a subscription store (documented follow-up); these handlers make
// the SW able to display them once that's wired.
self.addEventListener('push', (event) => {
  let payload = { title: 'Maxbuy Ventures', body: 'You have a new update.', url: '/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Background Sync: when connectivity returns, ask open clients to flush the
// offline sales queue. (The app also syncs on the window 'online' event, so
// this is a best-effort enhancement for browsers that support Background Sync.)
self.addEventListener('sync', (event) => {
  if (event.tag === 'maxbuy-sync-sales') {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        for (const client of clients) client.postMessage({ type: 'SYNC_SALES' });
      })()
    );
  }
});
