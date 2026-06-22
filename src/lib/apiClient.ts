import { useAuthStore } from '@/store/authStore';

/**
 * Authenticated fetch wrapper. Automatically attaches the JWT bearer token
 * and handles 401s by logging the user out.
 *
 * Usage:
 *   const data = await apiFetch('/api/products');
 *   const data = await apiFetch('/api/sales', { method: 'POST', body: JSON.stringify(payload) });
 */
export async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}
