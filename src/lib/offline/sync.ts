import { getPendingSales, markSynced, markConflict, getPendingCount } from './queue';

export interface SyncResult {
  synced: number;
  conflicts: number;
  remaining: number;
}

let syncing = false;

/**
 * Flushes queued offline sales to the server. Each sale carries a clientRef so
 * the server is idempotent (safe to retry). Outcomes:
 *  - 2xx              → marked synced
 *  - business 4xx     → marked conflict (e.g. insufficient stock); surfaced to staff
 *  - 401 / 429 / 5xx  → stop and retry on the next trigger (auth/rate/transient)
 *  - network error    → stop; retried on the next 'online' event
 */
export async function syncPendingSales(): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, conflicts: 0, remaining: await getPendingCount() };
  }
  if (syncing) {
    return { synced: 0, conflicts: 0, remaining: await getPendingCount() };
  }

  syncing = true;
  let synced = 0;
  let conflicts = 0;

  try {
    const pending = await getPendingSales();
    for (const sale of pending) {
      try {
        const res = await fetch('/api/sales', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale.payload),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          await markSynced(sale.clientRef, data?.sale?.invoiceNumber);
          synced += 1;
        } else if (res.status === 401 || res.status === 429 || res.status >= 500) {
          // Needs re-auth / rate-limited / server error — stop, retry later.
          break;
        } else {
          // Business rejection (e.g. insufficient stock) — won't succeed on retry.
          const data = await res.json().catch(() => ({}));
          await markConflict(sale.clientRef, data?.error || `Rejected (${res.status})`);
          conflicts += 1;
        }
      } catch {
        // Network dropped mid-sync — stop; the 'online' event will retry.
        break;
      }
    }
  } finally {
    syncing = false;
  }

  return { synced, conflicts, remaining: await getPendingCount() };
}
