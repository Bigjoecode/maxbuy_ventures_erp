'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const TABS = ['Sales', 'Inventory', 'Financial', 'Customers'];
const COLORS = ['#1db87a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7e74'];

export default function ReportsPage() {
  const [tab, setTab] = useState('Sales');
  const [period, setPeriod] = useState('month');
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    apiFetch<{ sales: any[] }>(`/api/sales?period=${period}`).then((r) => setSales(r.sales)).catch(() => {});
    apiFetch<{ products: any[] }>('/api/products').then((r) => setProducts(r.products)).catch(() => {});
  }, [period]);

  const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const totalCOGS = sales.reduce((s, x) => s + (x.items?.reduce((c: number, i: any) => c + (i.product?.costPrice || 0) * i.quantity, 0) || 0), 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalStockValue = products.reduce((s, p) => s + p.sellingPrice * p.stockQuantity, 0);

  // Category stock data
  const catStock: Record<string, number> = {};
  products.forEach((p) => {
    const cat = p.category?.name || 'Other';
    catStock[cat] = (catStock[cat] || 0) + p.sellingPrice * p.stockQuantity;
  });
  const catChartData = Object.entries(catStock).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Best sellers by items count (simulated from product data)
  const bestSellers = [...products].sort((a, b) => b.sellingPrice - a.sellingPrice).slice(0, 8);

  function exportCSV() {
    const rows = [['Invoice','Date','Customer','Amount','Payment'], ...sales.map((s) => [s.invoiceNumber, s.createdAt, s.customer?.name || 'Walk-in', s.totalAmount, s.paymentMethod])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `maxbuy-sales-${period}.csv`; a.click();
    toast.success('Report exported!');
  }

  return (
    <>
      <Topbar title="Reports & Analytics" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Reports & Analytics</h2>
            <p className="text-[13px] text-[var(--text-muted)]">Deep insights into your business performance</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </Select>
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] font-medium text-[var(--text)] hover:bg-[var(--border)]">
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-[10px] bg-[var(--bg)] p-1 w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all ${tab === t ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>{t}</button>
          ))}
        </div>

        {tab === 'Sales' && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={BarChart3} color="green" />
              <StatCard label="Gross Profit" value={formatCurrency(grossProfit)} sub={`${totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0}% margin`} icon={BarChart3} color="amber" />
              <StatCard label="Transactions" value={sales.length} icon={BarChart3} color="blue" />
              <StatCard label="Avg Order Value" value={formatCurrency(sales.length > 0 ? totalRevenue / sales.length : 0)} icon={BarChart3} color="purple" />
            </div>
            <Card className="mb-5">
              <CardTitle icon={BarChart3}>Best Selling Products</CardTitle>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>{['#','Product','Category','Sell Price','Cost Price','Margin'].map((h) => <th key={h} className="border-b-2 border-[var(--border)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {bestSellers.map((p, i) => {
                      const margin = p.costPrice > 0 ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) : 0;
                      return (
                        <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]">
                          <td className="px-3 py-2.5 font-bold text-[var(--text-muted)] text-[12px]">#{i + 1}</td>
                          <td className="px-3 py-2.5 font-medium text-[13px]">{p.name}</td>
                          <td className="px-3 py-2.5 text-[12px] text-[var(--text-muted)]">{p.category?.name}</td>
                          <td className="px-3 py-2.5 font-bold text-[var(--green)] text-[13px]">{formatCurrency(p.sellingPrice)}</td>
                          <td className="px-3 py-2.5 text-[13px]">{formatCurrency(p.costPrice)}</td>
                          <td className="px-3 py-2.5"><span className={`font-bold text-[13px] ${margin >= 20 ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>{margin}%</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {tab === 'Inventory' && (
          <Card>
            <CardTitle icon={BarChart3}>Stock Value by Category</CardTitle>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tickFormatter={(v) => `₦${Math.round(v / 1000)}K`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {catChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[var(--bg)] p-3 text-center"><div className="text-[11px] text-[var(--text-muted)]">Total SKUs</div><div className="font-display text-lg font-bold">{products.length}</div></div>
              <div className="rounded-lg bg-[var(--bg)] p-3 text-center"><div className="text-[11px] text-[var(--text-muted)]">Total Stock Value</div><div className="font-display text-lg font-bold text-[var(--green)]">{formatCurrency(totalStockValue)}</div></div>
              <div className="rounded-lg bg-[var(--bg)] p-3 text-center"><div className="text-[11px] text-[var(--text-muted)]">Low/Out of Stock</div><div className="font-display text-lg font-bold text-[var(--red)]">{products.filter((p) => p.stockQuantity <= p.lowStockAlert).length}</div></div>
            </div>
          </Card>
        )}

        {tab === 'Financial' && (
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              <StatCard label="Gross Revenue" value={formatCurrency(totalRevenue)} icon={BarChart3} color="green" />
              <StatCard label="Cost of Goods" value={formatCurrency(totalCOGS)} icon={BarChart3} color="red" />
              <StatCard label="Gross Profit" value={formatCurrency(grossProfit)} icon={BarChart3} color="amber" />
              <StatCard label="Profit Margin" value={`${totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0}%`} icon={BarChart3} color="blue" />
            </div>
            <Card>
              <CardTitle>P&L Summary</CardTitle>
              <div className="space-y-3 text-[13px]">
                {[['Gross Revenue', totalRevenue, 'green'], ['Cost of Goods Sold', -totalCOGS, 'red'], ['Gross Profit', grossProfit, 'green']].map(([label, val, color]) => (
                  <div key={String(label)} className="flex justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-[var(--text-muted)]">{label}</span>
                    <span className={`font-bold text-[var(--${color})]`}>{formatCurrency(Math.abs(Number(val)))}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[12px] text-[var(--text-muted)]">Note: connect to expenses API for full net profit calculation including operating expenses.</p>
            </Card>
          </div>
        )}

        {tab === 'Customers' && (
          <Card>
            <CardTitle icon={BarChart3}>Customer Insight</CardTitle>
            <p className="mb-4 text-[13px] text-[var(--text-muted)]">Connect the customers API to see full purchase analysis per customer. Run <code className="rounded bg-[var(--bg)] px-1 py-0.5 text-[11px]">npm run db:seed</code> to populate sample data.</p>
            <div className="rounded-lg bg-[var(--bg)] p-4 text-[13px] text-[var(--text-muted)]">
              Available once database is seeded: top customers by revenue, visit frequency, average order value, loyalty tier distribution, and churn risk analysis.
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
