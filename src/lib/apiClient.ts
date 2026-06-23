import { useAuthStore } from '@/store/authStore';

// A single shared refresh promise so that multiple concurrent 401s trigger
// only ONE /api/auth/refresh call. Refresh tokens rotate on every use, so
// parallel refreshes would otherwise invalidate each other.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function redirectToLogin() {
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined') window.location.href = '/login';
}

/**
 * Authenticated fetch wrapper. Auth travels via httpOnly cookies, so we just
 * send credentials. On a 401 it attempts a single silent token refresh and
 * retries once; if that fails the user is sent back to the login page.
 *
 * Usage:
 *   const data = await apiFetch('/api/products');
 *   const data = await apiFetch('/api/sales', { method: 'POST', body: JSON.stringify(payload) });
 */
export async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

  let res = await doFetch();

  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await doFetch();
    }
    if (res.status === 401) {
      redirectToLogin();
      throw new Error('Session expired. Please log in again.');
    }
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}
