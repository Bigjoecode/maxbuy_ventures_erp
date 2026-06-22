'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarX, Ban, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatDate, daysUntil, getExpiryStatus } from '@/lib/utils';
import { Product } from '@/types';

const CATEGORY_EMOJI: Record<string, string> = { Groceries:'🌾', Beverages:'🥤', 'Baby Feeds':'👶', Toiletries:'🧴', Cartons:'📦', Household:'🏠' };

export default function ExpiryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ products: Product[] }>('/api/products')
      .then((res) => setProducts(res.products.filter((p) => !!p.expiryDate)))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const withDays = products
    .map((p) => ({ ...p, days: daysUntil(p.expiryDate!), status: getExpiryStatus(p.expiryDate) }))
    .sort((a, b) => a.days - b.days);

  const counts = { expired: withDays.filter((p) => p.days < 0).length, critical: withDays.filter((p) => p.days >= 0 && p.days <= 7).length, warning: withDays.filter((p) => p.days > 7 && p.days <= 30).length, good: withDays.filter((p) => p.days > 30).length };

  const statusBadge = (status: string | null) => {
    if (status === 'expired') return <Badge color="red">Expired</Badge>;
    if (status === 'critical') return <Badge color="red">Critical</Badge>;
    if (status === 'warning') return <Badge color="amber">Warning</Badge>;
    return <Badge color="green">Good</Badge>;
  };

  return (
    <>
      <Topbar title="Expiry Tracker" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Expiry Tracker</h2>
          <p className="text-[13px] text-[var(--text-muted)]">Monitor product expiry dates to avoid losses</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <StatCard label="Already Expired" value={counts.expired} icon={Ban} color="red" />
          <StatCard label="Expiring in 7 Days" value={counts.critical} icon={AlertTriangle} color="amber" />
          <StatCard label="Expiring in 30 Days" value={counts.warning} icon={Calendar} color="blue" />
          <StatCard label="Good Products" value={counts.good} icon={CheckCircle2} color="green" />
        </div>

        <Card>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading products...</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {['Product', 'Category', 'Stock', 'Expiry Date', 'Days Left', 'Status'].map((h) => (
                      <th key={h} className="border-b-2 border-[var(--border)] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withDays.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]">
                      <td className="px-3 py-2.5 font-medium text-[13px]">{CATEGORY_EMOJI[p.category?.name || ''] || '📦'} {p.name}</td>
                      <td className="px-3 py-2.5"><Badge color="blue">{p.category?.name || '—'}</Badge></td>
                      <td className="px-3 py-2.5 text-[13px]">{p.stockQuantity}</td>
                      <td className="px-3 py-2.5 text-[12px]">{formatDate(p.expiryDate!)}</td>
                      <td className={`px-3 py-2.5 font-bold text-[13px] ${p.days < 0 ? 'text-[var(--red)]' : p.days <= 30 ? 'text-[var(--amber)]' : 'text-[var(--green)]'}`}>
                        {p.days < 0 ? 'EXPIRED' : `${p.days} days`}
                      </td>
                      <td className="px-3 py-2.5">{statusBadge(p.status)}</td>
                    </tr>
                  ))}
                  {withDays.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-[var(--text-muted)]">No products with expiry dates tracked</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
