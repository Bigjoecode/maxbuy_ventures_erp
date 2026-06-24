'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, Download, Users, Wallet } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CustomerType, ExpenseCategory } from '@/types';

const TABS = ['Sales', 'Inventory', 'Financial', 'Customers'];
const COLORS = ['#1db87a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7e74'];

interface ProductRecord {
  id: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockAlert: number;
  category?: { name: string } | null;
}

interface SaleItemRecord {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product?: { name: string } | null;
}

interface SaleRecord {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  totalAmount: number;
  paymentMethod: string;
  customer?: { name: string } | null;
  items: SaleItemRecord[];
}

interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
}

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  type: CustomerType;
  totalSpent: number;
  loyaltyPoints: number;
  debts?: Array<{ id: string; amount: number; amountPaid: number; isSettled: boolean }>;
}

interface TopProductRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  estimatedCost: number;
}

export default function ReportsPage() {
  const [tab, setTab] = useState('Sales');
  const [period, setPeriod] = useState('month');
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);

  useEffect(() => {
    let active = true;

    Promise.all([
      apiFetch<{ sales: SaleRecord[] }>(`/api/sales?period=${period}`).catch(() => ({ sales: [] })),
      apiFetch<{ products: ProductRecord[] }>('/api/products').catch(() => ({ products: [] })),
      apiFetch<{ expenses: ExpenseRecord[] }>(`/api/expenses?period=${period}`).catch(() => ({ expenses: [] })),
      apiFetch<{ customers: CustomerRecord[] }>('/api/customers').catch(() => ({ customers: [] })),
    ]).then(([salesRes, productsRes, expensesRes, customersRes]) => {
      if (!active) return;
      setSales(salesRes.sales);
      setProducts(productsRes.products);
      setExpenses(expensesRes.expenses);
      setCustomers(customersRes.customers);
    });

    return () => {
      active = false;
    };
  }, [period]);

  const productMap = new Map(products.map((product) => [product.id, product]));

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCOGS = sales.reduce(
    (sum, sale) =>
      sum +
      sale.items.reduce((itemSum, item) => {
        const product = productMap.get(item.productId);
        return itemSum + (product?.costPrice || 0) * item.quantity;
      }, 0),
    0
  );
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const totalStockValue = products.reduce((sum, product) => sum + product.sellingPrice * product.stockQuantity, 0);

  const categoryStock: Record<string, number> = {};
  products.forEach((product) => {
    const category = product.category?.name || 'Other';
    categoryStock[category] = (categoryStock[category] || 0) + product.sellingPrice * product.stockQuantity;
  });
  const catChartData = Object.entries(categoryStock)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const productSales = new Map<string, TopProductRow>();
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = productSales.get(item.productId);
      const product = productMap.get(item.productId);
      const quantity = (existing?.quantity || 0) + item.quantity;
      const revenue = (existing?.revenue || 0) + item.lineTotal;
      const estimatedCost = (existing?.estimatedCost || 0) + (product?.costPrice || 0) * item.quantity;
      productSales.set(item.productId, {
        id: item.productId,
        name: item.product?.name || product?.name || 'Unknown product',
        category: product?.category?.name || 'Other',
        quantity,
        revenue,
        estimatedCost,
      });
    });
  });
  const topProducts = [...productSales.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8);

  const expenseByCategory = Object.entries(
    expenses.reduce<Record<ExpenseCategory, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {
      RENT: 0,
      ELECTRICITY: 0,
      TRANSPORT: 0,
      STAFF_SALARY: 0,
      RESTOCKING: 0,
      REPAIRS: 0,
      OTHER: 0,
    })
  )
    .map(([category, amount]) => ({ category: category as ExpenseCategory, amount }))
    .filter((expense) => expense.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalCustomers = customers.length;
  const totalLoyaltyPoints = customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0);
  const customerDebtRows = customers
    .map((customer) => ({
      ...customer,
      outstandingDebt: (customer.debts || []).reduce((sum, debt) => sum + Math.max(debt.amount - debt.amountPaid, 0), 0),
    }))
    .filter((customer) => customer.outstandingDebt > 0);
  const customerTypeCounts = customers.reduce<Record<CustomerType, number>>(
    (acc, customer) => {
      acc[customer.type] += 1;
      return acc;
    },
    { RETAIL: 0, WHOLESALE: 0, VIP: 0 }
  );
  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  function exportCSV() {
    const rows = [
      ['Invoice', 'Date', 'Customer', 'Amount', 'Payment'],
      ...sales.map((sale) => [sale.invoiceNumber, sale.createdAt, sale.customer?.name || 'Walk-in', sale.totalAmount, sale.paymentMethod]),
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `maxbuy-sales-${period}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  }

  return (
    <>
      <Topbar title="Reports & Analytics" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Reports & Analytics</h2>
            <p className="text-[13px] text-[var(--text-muted)]">Live sales, inventory, finance, and customer performance for the selected period.</p>
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

        <div className="mb-5 flex w-fit gap-1 rounded-[10px] bg-[var(--bg)] p-1">
          {TABS.map((label) => (
            <button
              key={label}
              onClick={() => setTab(label)}
              className={`rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all ${tab === label ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'Sales' && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={BarChart3} color="green" />
              <StatCard label="Estimated Gross Profit" value={formatCurrency(grossProfit)} sub={`${totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0}% margin`} icon={BarChart3} color="amber" />
              <StatCard label="Transactions" value={sales.length} icon={BarChart3} color="blue" />
              <StatCard label="Avg Order Value" value={formatCurrency(sales.length > 0 ? totalRevenue / sales.length : 0)} icon={BarChart3} color="purple" />
            </div>
            <Card className="mb-5">
              <CardTitle icon={BarChart3}>Top Selling Products</CardTitle>
              {topProducts.length === 0 ? (
                <EmptyState message="No sales yet for the selected period." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr>
                        {['#', 'Product', 'Category', 'Qty Sold', 'Revenue', 'Margin'].map((heading) => (
                          <th key={heading} className="border-b-2 border-[var(--border)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, index) => {
                        const marginPct = product.revenue > 0 ? Math.round(((product.revenue - product.estimatedCost) / product.revenue) * 100) : 0;
                        return (
                          <tr key={product.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]">
                            <td className="px-3 py-2.5 text-[12px] font-bold text-[var(--text-muted)]">#{index + 1}</td>
                            <td className="px-3 py-2.5 text-[13px] font-medium">{product.name}</td>
                            <td className="px-3 py-2.5 text-[12px] text-[var(--text-muted)]">{product.category}</td>
                            <td className="px-3 py-2.5 text-[13px]">{product.quantity}</td>
                            <td className="px-3 py-2.5 text-[13px] font-bold text-[var(--green)]">{formatCurrency(product.revenue)}</td>
                            <td className={`px-3 py-2.5 text-[13px] font-bold ${marginPct >= 20 ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>{marginPct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {tab === 'Inventory' && (
          <Card>
            <CardTitle icon={BarChart3}>Stock Value by Category</CardTitle>
            {catChartData.length === 0 ? (
              <EmptyState message="No inventory data available yet." />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" tickFormatter={(value) => `₦${Math.round(value / 1000)}K`} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {catChartData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricTile label="Total SKUs" value={String(products.length)} />
              <MetricTile label="Total Stock Value" value={formatCurrency(totalStockValue)} accent="text-[var(--green)]" />
              <MetricTile label="Low / Out of Stock" value={String(products.filter((product) => product.stockQuantity <= product.lowStockAlert).length)} accent="text-[var(--red)]" />
            </div>
          </Card>
        )}

        {tab === 'Financial' && (
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              <StatCard label="Gross Revenue" value={formatCurrency(totalRevenue)} icon={BarChart3} color="green" />
              <StatCard label="Estimated COGS" value={formatCurrency(totalCOGS)} icon={BarChart3} color="red" />
              <StatCard label="Operating Expenses" value={formatCurrency(totalExpenses)} icon={Wallet} color="amber" />
              <StatCard label="Net Profit" value={formatCurrency(netProfit)} sub={netProfit >= 0 ? 'After expenses' : 'Loss after expenses'} icon={BarChart3} color="blue" />
            </div>
            <Card>
              <CardTitle>P&L Summary</CardTitle>
              <div className="space-y-3 text-[13px]">
                {[
                  ['Gross Revenue', totalRevenue, 'text-[var(--green)]'],
                  ['Estimated Cost of Goods Sold', totalCOGS, 'text-[var(--red)]'],
                  ['Operating Expenses', totalExpenses, 'text-[var(--amber)]'],
                  ['Net Profit', netProfit, netProfit >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'],
                ].map(([label, value, className]) => (
                  <div key={String(label)} className="flex justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-[var(--text-muted)]">{label}</span>
                    <span className={`font-bold ${className}`}>{formatCurrency(Number(value))}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardTitle icon={Wallet}>Expense Breakdown</CardTitle>
              {expenseByCategory.length === 0 ? (
                <EmptyState message="No expenses recorded for the selected period." />
              ) : (
                <div className="space-y-2">
                  {expenseByCategory.map((expense) => (
                    <div key={expense.category} className="flex items-center justify-between rounded-lg bg-[var(--bg)] px-3 py-2 text-[13px]">
                      <span className="font-medium text-[var(--text)]">{formatExpenseCategory(expense.category)}</span>
                      <span className="font-bold text-[var(--amber)]">{formatCurrency(expense.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === 'Customers' && (
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              <StatCard label="Customers" value={totalCustomers} icon={Users} color="green" />
              <StatCard label="Debtors" value={customerDebtRows.length} icon={Users} color="amber" />
              <StatCard label="Loyalty Points" value={totalLoyaltyPoints} icon={Users} color="blue" />
              <StatCard label="Top Customer Spend" value={formatCurrency(topCustomers[0]?.totalSpent || 0)} icon={Users} color="purple" />
            </div>
            <Card>
              <CardTitle icon={Users}>Customer Mix</CardTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricTile label="Retail" value={String(customerTypeCounts.RETAIL)} />
                <MetricTile label="Wholesale" value={String(customerTypeCounts.WHOLESALE)} />
                <MetricTile label="VIP" value={String(customerTypeCounts.VIP)} />
              </div>
            </Card>
            <Card>
              <CardTitle icon={Users}>Top Customers by Spend</CardTitle>
              {topCustomers.length === 0 ? (
                <EmptyState message="No customer data available yet." />
              ) : (
                <div className="space-y-2">
                  {topCustomers.map((customer) => {
                    const outstanding = customerDebtRows.find((row) => row.id === customer.id)?.outstandingDebt || 0;
                    return (
                      <div key={customer.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-medium text-[var(--text)]">{customer.name}</p>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {formatCustomerType(customer.type)} · {customer.phone}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-bold text-[var(--green)]">{formatCurrency(customer.totalSpent)}</p>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {outstanding > 0 ? `Debt: ${formatCurrency(outstanding)}` : `${customer.loyaltyPoints} pts`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            <Card>
              <CardTitle icon={Users}>Customers Requiring Attention</CardTitle>
              {customerDebtRows.length === 0 ? (
                <EmptyState message="No customers currently have unsettled debt." />
              ) : (
                <div className="space-y-2">
                  {customerDebtRows
                    .sort((a, b) => b.outstandingDebt - a.outstandingDebt)
                    .slice(0, 5)
                    .map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between rounded-lg bg-[var(--bg)] px-3 py-2 text-[13px]">
                        <div>
                          <p className="font-medium text-[var(--text)]">{customer.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{customer.phone}</p>
                        </div>
                        <span className="font-bold text-[var(--red)]">{formatCurrency(customer.outstandingDebt)}</span>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

function MetricTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg)] p-3 text-center">
      <div className="text-[11px] text-[var(--text-muted)]">{label}</div>
      <div className={`font-display text-lg font-bold ${accent || 'text-[var(--text)]'}`}>{value}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-lg bg-[var(--bg)] p-4 text-[13px] text-[var(--text-muted)]">{message}</div>;
}

function formatCustomerType(type: CustomerType) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function formatExpenseCategory(category: ExpenseCategory) {
  return category
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
