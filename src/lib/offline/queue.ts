import { db, PendingSale } from './db';

export const QUEUE_UPDATED_EVENT = 'maxbuy:queue-updated';

function notifyQueueChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(QUEUE_UPDATED_EVENT));
}

export async function enqueueSale(sale: PendingSale): Promise<void> {
  if (!db) return;
  await db.pendingSales.put(sale);
  notifyQueueChanged();
}

export async function getPendingSales(): Promise<PendingSale[]> {
  if (!db) return [];
  return db.pendingSales.where('status').equals('pending').sortBy('createdAt');
}

export async function getPendingCount(): Promise<number> {
  if (!db) return 0;
  return db.pendingSales.where('status').equals('pending').count();
}

/** All queued sales (pending + conflicts + recently synced) for the queue UI. */
export async function getAllQueued(): Promise<PendingSale[]> {
  if (!db) return [];
  return db.pendingSales.orderBy('createdAt').reverse().toArray();
}

export async function markSynced(clientRef: string, invoiceNumber?: string): Promise<void> {
  if (!db) return;
  await db.pendingSales.update(clientRef, { status: 'synced', syncedInvoiceNumber: invoiceNumber });
  notifyQueueChanged();
}

export async function markConflict(clientRef: string, error: string): Promise<void> {
  if (!db) return;
  await db.pendingSales.update(clientRef, { status: 'conflict', error });
  notifyQueueChanged();
}

export async function discardQueued(clientRef: string): Promise<void> {
  if (!db) return;
  await db.pendingSales.delete(clientRef);
  notifyQueueChanged();
}
