// Local (client-side) notifications. Used to surface sync results when the PWA
// is backgrounded. Full server-sent Web Push (VAPID + subscription store) is a
// documented follow-up; the service worker already has the push handlers.

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export function showLocalNotification(title: string, body: string, url = '/'): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const options: NotificationOptions = { body, icon: '/icons/icon-192.png', data: { url } };
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options)).catch(() => {});
    } else {
      new Notification(title, options);
    }
  } catch {
    /* notifications are best-effort */
  }
}
