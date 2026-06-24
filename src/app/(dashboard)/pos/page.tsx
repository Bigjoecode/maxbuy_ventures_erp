'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, CreditCard, Repeat, ShoppingCart, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Input, Select, Button, Modal } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import { Product, Customer } from '@/types';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { cacheProducts, getCachedProducts, cacheCustomers, getCachedCustomers, adjustCachedStock } from '@/lib/offline/cache';
import { enqueueSale } from '@/lib/offline/queue';
import { ensureNotificationPermission } from '@/lib/offline/pushNotify';

const CATEGORY_EMOJI: Record<string, string> = {
  Groceries: '🌾',
  Beverages: '🥤',
  'Baby Feeds': '👶',
  Toiletries: '🧴',
  Cartons: '📦',
  Household: '🏠',
};

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const cart = useCartStore();

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  async function loadProducts() {
    try {
      const res = await apiFetch<{ products: Product[] }>('/api/products');
      setProducts(res.products);
      cacheProducts(res.products); // keep the offline catalog fresh
    } catch {
      // Offline (or server unreachable): fall back to the cached catalog.
      const cached = await getCachedProducts();
      setProducts(cached);
      if (cached.length === 0) toast.error('No products available offline yet. Connect once to cache them.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const res = await apiFetch<{ customers: Customer[] }>('/api/customers');
      setCustomers(res.customers);
      cacheCustomers(res.customers);
    } catch {
      setCustomers(await getCachedCustomers()); // walk-in is still supported
    }
  }

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category?.name).filter(Boolean) as string[]);
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || p.category?.name === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  function handleAddToCart(p: Product) {
    if (p.stockQuantity <= 0) return;
    cart.addItem({
      productId: p.id,
      name: p.name,
      emoji: CATEGORY_EMOJI[p.category?.name || ''] || '📦',
      price: p.sellingPrice,
      stockQuantity: p.stockQuantity,
    });
  }

  async function handleCheckout() {
    if (cart.items.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    const clientRef = crypto.randomUUID();
    const customer = customers.find((c) => c.id === cart.customerId);
    const payload = {
      customerId: cart.customerId || null,
      items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      discountPct: cart.discountPct,
      paymentMethod: cart.paymentMethod,
      clientRef,
    };
    const baseReceipt = {
      customerName: customer?.name || 'Walk-in Customer',
      items: cart.items,
      subtotal: cart.subtotal(),
      discountPct: cart.discountPct,
      total: cart.total(),
      paymentMethod: cart.paymentMethod,
    };

    setCheckingOut(true);
    try {
      // Try online first (unless the browser already knows it's offline).
      if (navigator.onLine) {
        let res: Response | null = null;
        try {
          res = await fetch('/api/sales', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch {
          res = null; // network dropped → fall through to offline queue
        }

        if (res) {
          if (res.status === 401) {
            window.location.href = '/login';
            return;
          }
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            setReceipt({ ...baseReceipt, invoiceNumber: data.sale.invoiceNumber });
            toast.success(`Sale completed! ${formatCurrency(cart.total())}`);
            loadProducts();
            return;
          }
          // Business rejection (e.g. insufficient stock) — do NOT queue offline.
          toast.error(data.error || 'Sale could not be completed');
          return;
        }
      }

      // OFFLINE: queue the sale, optimistically decrement the cached stock.
      ensureNotificationPermission(); // gesture-tied: enables "synced" notifications later
      await enqueueSale({ clientRef, payload, display: baseReceipt, status: 'pending', createdAt: Date.now() });
      await adjustCachedStock(payload.items);
      setProducts(await getCachedProducts());
      setReceipt({ ...baseReceipt, invoiceNumber: 'Pending sync (offline)' });
      toast.success('Saved offline — will sync automatically when back online');
    } finally {
      setCheckingOut(false);
    }
  }

  function handleReceiptClose() {
    setReceipt(null);
    cart.clear();
  }

  return (
    <>
      <Topbar title="Point of Sale" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Point of Sale</h2>
            <p className="text-[13px] text-[var(--text-muted)]">Fast checkout for walk-in and wholesale customers</p>
          </div>
          <Button variant="secondary" onClick={() => cart.clear()}>
            <Trash2 size={14} /> Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          {/* Product grid */}
          <div className="lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto">
            <div className="mb-3 flex flex-wrap gap-2">
              <Input
                placeholder="🔍 Search products or scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-[200px] flex-1"
              />
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>

            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading products...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {filteredProducts.map((p) => {
                  const emoji = CATEGORY_EMOJI[p.category?.name || ''] || '📦';
                  const out = p.stockQuantity <= 0;
                  const low = p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleAddToCart(p)}
                      disabled={out}
                      className="rounded-xl border-[1.5px] border-[var(--border)] bg-[var(--card)] p-3.5 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--green)] hover:bg-[var(--green-light)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="mb-2 text-[28px]">{emoji}</div>
                      <div className="mb-1 text-xs font-semibold text-[var(--text)]">{p.name}</div>
                      <div className="font-display text-sm font-bold text-[var(--green)]">{formatCurrency(p.sellingPrice)}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        Stock: {p.stockQuantity} {p.unit}
                        {out ? ' • OUT' : low ? ' • LOW' : ''}
                      </div>
                    </button>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <p className="col-span-full text-sm text-[var(--text-muted)]">No products match your search.</p>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="flex flex-col rounded-[14px] border border-[var(--border)] bg-[var(--card)]">
            <div className="border-b border-[var(--border)] p-4">
              <div className="mb-2 flex items-center justify-between">
                <strong className="font-display text-[15px]">Current Order</strong>
                <span className="rounded-full bg-[var(--green-light)] px-2 py-0.5 text-[11px] font-semibold text-[var(--green-dark)]">
                  {cart.itemCount()} items
                </span>
              </div>
              <Select value={cart.customerId || ''} onChange={(e) => cart.setCustomer(e.target.value || null)} className="w-full text-xs">
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex-1 overflow-y-auto p-2" style={{ minHeight: 200, maxHeight: 360 }}>
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-[var(--text-muted)]">
                  <ShoppingCart size={32} className="mb-2 opacity-30" />
                  <span className="text-xs">Tap products to add them here</span>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.productId} className="mb-1 flex items-center gap-2 rounded-lg p-2 hover:bg-[var(--bg)]">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="flex-1 text-xs font-medium">{item.name}</span>
                    <div className="flex items-center gap-1.5">
                      <QtyButton onClick={() => cart.decrementItem(item.productId)}>−</QtyButton>
                      <span className="min-w-[20px] text-center text-[13px] font-bold">{item.quantity}</span>
                      <QtyButton onClick={() => cart.incrementItem(item.productId)}>+</QtyButton>
                    </div>
                    <span className="min-w-[60px] text-right text-xs font-bold text-[var(--green)]">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[var(--border)] p-3.5">
              <Row label="Subtotal" value={formatCurrency(cart.subtotal())} />
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Discount</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={cart.discountPct || ''}
                    onChange={(e) => cart.setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-[60px] rounded-md border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 text-right text-xs text-[var(--text)] outline-none"
                  />
                  <span className="text-[11px] text-[var(--text-muted)]">%</span>
                </div>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Total</span>
                <span className="font-display text-[22px] font-extrabold text-[var(--green)]">{formatCurrency(cart.total())}</span>
              </div>

              <div className="mb-2 grid grid-cols-3 gap-1.5">
                <PayButton active={cart.paymentMethod === 'CASH'} onClick={() => cart.setPaymentMethod('CASH')} icon={Banknote} label="Cash" />
                <PayButton active={cart.paymentMethod === 'TRANSFER'} onClick={() => cart.setPaymentMethod('TRANSFER')} icon={Repeat} label="Transfer" />
                <PayButton active={cart.paymentMethod === 'POS'} onClick={() => cart.setPaymentMethod('POS')} icon={CreditCard} label="POS" />
              </div>

              <Button onClick={handleCheckout} disabled={checkingOut} className="w-full justify-center py-3">
                {checkingOut ? 'Processing...' : 'Complete Sale'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {receipt && <ReceiptModal data={receipt} onClose={handleReceiptClose} />}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className="text-[13px] font-semibold">{value}</span>
    </div>
  );
}

function QtyButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] text-sm font-bold hover:bg-[var(--green)] hover:text-white hover:border-[var(--green)]"
    >
      {children}
    </button>
  );
}

function PayButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border-[1.5px] p-1.5 text-center text-[11px] font-semibold transition-all ${
        active
          ? 'border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]'
          : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:border-[var(--green)]'
      }`}
    >
      <Icon size={14} className="mx-auto mb-0.5" />
      {label}
    </button>
  );
}
