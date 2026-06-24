'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Wallet, ShoppingCart, Boxes, AlertTriangle, Plus, PackagePlus, MinusCircle, UserPlus, FileDown, Bot, HandCoins, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { canAccess } from '@/lib/nav';

interface DashboardData {
  stats: {
    todayRevenue: number;
    todaySalesCount: number;
    totalStockValue: number;
    totalProducts: number;
    outstandingDebts: number;
    debtorsCount: number;
    revenueChangePct: number;
  };
  weeklySales: Record<string, number>;
  categoryBreakdown: { name: string; value: number }[];
  alerts: {
    lowStock: { id: string; name: string; stockQuantity: number }[];
    outOfStock: { id: string; name: string }[];
  };
}

const CATEGORY_COLORS = ['#1db87a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7e74'];

const QUICK_ACTIONS = [
  { label: 'New Sale', icon: ShoppingCart, href: '/pos', permission: 'pos' },
  { label: 'Add Product', icon: PackagePlus, href: '/inventory', permission: 'inventory' },
  { label: 'Add Expense', icon: MinusCircle, href: '/expenses', permission: 'expenses' },
  { label: 'New Customer', icon: UserPlus, href: '/customers', permission: 'customers' },
  { label: 'Export Report', icon: FileDown, href: '/reports', permission: 'reports' },
  { label: 'AI Insights', icon: Bot, href: '/ai-assistant', permission: 'reports' },
];

export default function DashboardPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const quickActions = QUICK_ACTIONS.filter((a) => canAccess(role, a.permission));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await apiFetch<DashboardData>('/api/dashboard');
      setData(res);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const weeklyChartData = data
    ? Object.entries(data.weeklySales).map(([day, revenue]) => ({ day, revenue }))
    : [];

  // Real sales-by-category (last 30 days) from /api/dashboard.
  const categoryData = data?.categoryBreakdown ?? [];

  return (
    <>
      <Topbar title="Dashboard" onAlertsClick={() => router.push('/expiry')} />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Good morning! 👋</h2>
            <p className="text-[13px] text-[var(--text-muted)]">
              Here&apos;s your business overview for today —{' '}
              {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => router.push('/pos')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--green)] px-4 py-2 text-[13px] font-medium text-white hover:bg-[var(--green-dark)]"
          >
            <Plus size={14} /> New Sale
          </button>
        </div>

        {/* Stat cards */}
        <div className="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today's Revenue"
            value={loading ? '...' : formatCurrency(data?.stats.todayRevenue || 0)}
            sub={`${data?.stats.revenueChangePct ?? 0}% vs yesterday`}
            subType={(data?.stats.revenueChangePct ?? 0) >= 0 ? 'up' : 'down'}
            icon={Wallet}
            color="green"
          />
          <StatCard
            label="Today's Sales"
            value={loading ? '...' : data?.stats.todaySalesCount ?? 0}
            sub="transactions"
            icon={ShoppingCart}
            color="amber"
          />
          <StatCard
            label="Total Stock Value"
            value={loading ? '...' : formatCurrency(data?.stats.totalStockValue || 0)}
            sub={`Across ${data?.stats.totalProducts ?? 0} products`}
            icon={Boxes}
            color="blue"
          />
          <StatCard
            label="Outstanding Debts"
            value={loading ? '...' : formatCurrency(data?.stats.outstandingDebts || 0)}
            sub={`${data?.stats.debtorsCount ?? 0} customers owing`}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Charts */}
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardTitle>Weekly Sales Trend</CardTitle>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyChartData}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1db87a" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#1db87a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" tickFormatter={(v) => `₦${Math.round(v / 1000)}K`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#1db87a" strokeWidth={2} fill="url(#revGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardTitle>Sales by Category (30 days)</CardTitle>
            <div className="flex h-[200px] w-full items-center justify-center">
              {categoryData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="px-4 text-center text-[13px] text-[var(--text-muted)]">
                  {loading ? 'Loading…' : 'No sales in the last 30 days yet — category breakdown will appear here once you start selling.'}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Alerts + activity */}
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardTitle icon={AlertTriangle}>Stock Alerts</CardTitle>
            <div className="flex flex-col gap-2">
              {data?.alerts.outOfStock.length ? (
                <AlertRow color="red" title={`${data.alerts.outOfStock.length} products out of stock`} sub={data.alerts.outOfStock.map((p) => p.name).join(', ')} />
              ) : null}
              {data?.alerts.lowStock.length ? (
                <AlertRow color="amber" title={`${data.alerts.lowStock.length} products low on stock`} sub="Needs restocking soon" />
              ) : null}
              {!data?.alerts.lowStock.length && !data?.alerts.outOfStock.length && !loading && (
                <AlertRow color="green" title="All stock levels healthy" sub="No products are low or out of stock." />
              )}
              {loading && <p className="text-xs text-[var(--text-muted)]">Loading alerts…</p>}
            </div>
          </Card>

          <Card>
            <CardTitle icon={HandCoins}>Outstanding Debts</CardTitle>
            <p className="font-display text-[26px] font-extrabold text-[var(--text)]">
              {loading ? '…' : formatCurrency(data?.stats.outstandingDebts || 0)}
            </p>
            <p className="text-[13px] text-[var(--text-muted)]">
              Owed by {data?.stats.debtorsCount ?? 0} customer{(data?.stats.debtorsCount ?? 0) === 1 ? '' : 's'}.
            </p>
            <button
              onClick={() => router.push('/debts')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] transition-colors hover:border-[var(--green)] hover:text-[var(--green)]"
            >
              View Debts &amp; Credits
            </button>
          </Card>

          <Card>
            <CardTitle icon={Lightbulb}>Business Tips</CardTitle>
            <ul className="flex flex-col gap-2 text-[13px] text-[var(--text-muted)]">
              <li>• Restock fast-movers before they hit zero to avoid lost sales.</li>
              <li>• Follow up on overdue debts weekly to keep cash flowing.</li>
              <li>• Review thin-margin items and renegotiate supplier prices.</li>
              <li>• Check the Reports page to spot your best-selling lines.</li>
            </ul>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--green)] hover:bg-[var(--green-light)]"
              >
                <Icon size={22} className="mx-auto mb-2 text-[var(--green)]" />
                <span className="text-xs font-semibold text-[var(--text)]">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function AlertRow({ color, title, sub }: { color: 'red' | 'amber' | 'green'; title: string; sub: string }) {
  const styles = {
    red: { bg: 'bg-[var(--red-light)] border-red-300', text: 'text-[var(--red)]' },
    amber: { bg: 'bg-[var(--amber-light)] border-amber-300', text: 'text-[var(--amber)]' },
    green: { bg: 'bg-[var(--green-light)] border-emerald-300', text: 'text-[var(--green)]' },
  }[color];

  return (
    <div className={`flex items-start gap-3 rounded-[10px] border p-3 ${styles.bg}`}>
      <AlertTriangle size={15} className={`mt-0.5 ${styles.text}`} />
      <div>
        <p className="text-xs font-semibold text-[var(--text)]">{title}</p>
        <span className="text-[11px] text-[var(--text-muted)]">{sub}</span>
      </div>
    </div>
  );
}
