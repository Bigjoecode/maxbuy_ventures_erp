'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Receipt, TrendingUp, ShoppingCart, RotateCcw, Eye } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Select, Badge } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  useEffect(() => { load(); }, [period]);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ sales: any[] }>(`/api/sales?period=${period}`);
      setSales(res.sales);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const grossProfit = sales.reduce((s, x) => {
    const cost = x.items?.reduce((c: number, i: any) => c + (i.product?.costPrice || 0) * i.quantity, 0) || 0;
    return s + (x.totalAmount - cost);
  }, 0);

  const payBadge = (m: string) => {
    const map: Record<string, any> = { CASH: 'green', TRANSFER: 'blue', POS: 'purple', CREDIT: 'red' };
    return <Badge color={map[m] || 'gray'}>{m}</Badge>;
  };

  return (
    <>
      <Topbar title="Sales & Invoices" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Sales & Invoices</h2>
            <p className="text-[13px] text-[var(--text-muted)]">All transactions and generated invoices</p>
          </div>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </Select>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={Receipt} color="green" />
          <StatCard label="Gross Profit" value={formatCurrency(grossProfit)} sub={`${totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0}% margin`} icon={TrendingUp} color="amber" />
          <StatCard label="Transactions" value={sales.length} icon={ShoppingCart} color="blue" />
          <StatCard label="Refunded" value={sales.filter((s) => s.isRefunded).length} icon={RotateCcw} color="red" />
        </div>

        <Card>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading sales...</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {['Invoice #', 'Date & Time', 'Customer', 'Items', 'Payment', 'Amount', 'Staff', 'View'].map((h) => (
                      <th key={h} className="border-b-2 border-[var(--border)] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]">
                      <td className="px-3 py-2.5 font-bold text-[var(--green)] text-[13px]">{s.invoiceNumber}</td>
                      <td className="px-3 py-2.5 text-[12px] text-[var(--text-muted)] whitespace-nowrap">{formatDateTime(s.createdAt)}</td>
                      <td className="px-3 py-2.5 text-[13px]">{s.customer?.name || 'Walk-in'}</td>
                      <td className="px-3 py-2.5 text-[13px]">{s.items?.length || 0}</td>
                      <td className="px-3 py-2.5">{payBadge(s.paymentMethod)}</td>
                      <td className="px-3 py-2.5 font-bold text-[13px]">{formatCurrency(s.totalAmount)}</td>
                      <td className="px-3 py-2.5 text-[12px]">{s.staff?.name || '—'}</td>
                      <td className="px-3 py-2.5">
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--green-light)] hover:text-[var(--green)]" title="View invoice">
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-[var(--text-muted)]">No sales found for this period</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
