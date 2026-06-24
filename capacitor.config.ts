import type { CapacitorConfig } from '@capacitor/cli';

// Maxbuy Ventures is a server-rendered Next.js app (API routes + PWA), so the
// Android shell loads the deployed PWA URL rather than a static bundle. The PWA
// already provides offline support (service worker + IndexedDB), so the native
// app inherits offline POS, install, and sync.
//
// Set CAP_SERVER_URL to your production URL before `npx cap sync`.
const SERVER_URL = process.env.CAP_SERVER_URL || 'https://maxbuy-ventures-erp.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.maxbuy.erp',
  appName: 'Maxbuy Ventures',
  webDir: 'public', // required by Capacitor; not used when server.url is set
  server: {
    url: SERVER_URL,
    cleartext: false, // HTTPS only
  },
  android: {
    backgroundColor: '#071410',
  },
};

export default config;
