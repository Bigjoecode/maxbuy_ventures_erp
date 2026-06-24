import { db } from './db';
import type { Product, Customer } from '@/types';

export async function cacheProducts(products: Product[]): Promise<void> {
  if (!db) return;
  await db.transaction('rw', db.products, db.meta, async () => {
    await db.products.clear();
    await db.products.bulkPut(products);
    await db.meta.put({ key: 'products_cached_at', value: Date.now() });
  });
}

export async function getCachedProducts(): Promise<Product[]> {
  if (!db) return [];
  return db.products.toArray();
}

export async function cacheCustomers(customers: Customer[]): Promise<void> {
  if (!db) return;
  await db.transaction('rw', db.customers, async () => {
    await db.customers.clear();
    await db.customers.bulkPut(customers);
  });
}

export async function getCachedCustomers(): Promise<Customer[]> {
  if (!db) return [];
  return db.customers.toArray();
}

/** Optimistically decrement cached stock when an offline sale is queued, so the
 * POS reflects sold quantities until the real sync reconciles with the server. */
export async function adjustCachedStock(
  items: { productId: string; quantity: number }[]
): Promise<void> {
  if (!db) return;
  await db.transaction('rw', db.products, async () => {
    for (const it of items) {
      const p = await db.products.get(it.productId);
      if (p) {
        p.stockQuantity = Math.max(0, p.stockQuantity - it.quantity);
        await db.products.put(p);
      }
    }
  });
}

export async function getProductsCachedAt(): Promise<number | null> {
  if (!db) return null;
  const row = await db.meta.get('products_cached_at');
  return row?.value ?? null;
}
