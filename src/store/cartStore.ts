import { create } from 'zustand';
import { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  discountPct: number;
  customerId: string | null;
  paymentMethod: 'CASH' | 'TRANSFER' | 'POS';

  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  setDiscount: (pct: number) => void;
  setCustomer: (customerId: string | null) => void;
  setPaymentMethod: (method: 'CASH' | 'TRANSFER' | 'POS') => void;
  clear: () => void;

  subtotal: () => number;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discountPct: 0,
  customerId: null,
  paymentMethod: 'CASH',

  addItem: (item) => {
    const items = get().items;
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      if (existing.quantity >= item.stockQuantity) return; // prevent over-selling
      set({
        items: items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] });
    }
  },

  incrementItem: (productId) => {
    const items = get().items;
    const item = items.find((i) => i.productId === productId);
    if (!item || item.quantity >= item.stockQuantity) return;
    set({ items: items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i)) });
  },

  decrementItem: (productId) => {
    const items = get().items;
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    if (item.quantity <= 1) {
      set({ items: items.filter((i) => i.productId !== productId) });
    } else {
      set({ items: items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i)) });
    }
  },

  removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),

  setDiscount: (pct) => set({ discountPct: Math.max(0, Math.min(100, pct)) }),

  setCustomer: (customerId) => set({ customerId }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  clear: () => set({ items: [], discountPct: 0, customerId: null, paymentMethod: 'CASH' }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  total: () => {
    const sub = get().subtotal();
    return sub * (1 - get().discountPct / 100);
  },

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
