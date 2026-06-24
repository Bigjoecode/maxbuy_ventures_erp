import Dexie, { Table } from 'dexie';
import type { Product, Customer } from '@/types';

export interface PendingSale {
  clientRef: string; // primary key + server idempotency key
  payload: {
    customerId: string | null;
    items: { productId: string; quantity: number }[];
    discountPct: number;
    paymentMethod: string;
    clientRef: string;
  };
  // Denormalized snapshot for the receipt / queue UI (avoids needing the
  // product catalog when displaying a queued sale).
  display: {
    customerName: string;
    items: { name: string; emoji: string; price: number; quantity: number }[];
    subtotal: number;
    discountPct: number;
    total: number;
    paymentMethod: string;
  };
  status: 'pending' | 'synced' | 'conflict';
  error?: string;
  createdAt: number;
  syncedInvoiceNumber?: string;
}

class MaxbuyDB extends Dexie {
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  pendingSales!: Table<PendingSale, string>;
  meta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('maxbuy-offline');
    this.version(1).stores({
      products: 'id, name, barcode',
      customers: 'id, name, phone',
      pendingSales: 'clientRef, status, createdAt',
      meta: 'key',
    });
  }
}

// Guard against SSR: Dexie/IndexedDB only exist in the browser.
export const db = typeof window !== 'undefined' ? new MaxbuyDB() : (null as unknown as MaxbuyDB);
