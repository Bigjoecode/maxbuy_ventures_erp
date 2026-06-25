'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Receipt, TrendingUp, ShoppingCart, RotateCcw, Eye, Printer, Download } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Select, Badge, Modal, Button } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [viewSale, setViewSale] = useState<any | null>(null);

  const load = useCallback(async (currentPeriod: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ sales: any[] }>(`/api/sales?period=${currentPeriod}`);
      setSales(res.sales);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(period); }, [period, load]);

  function exportCsv() {
    if (sales.length === 0) { toast.error('No sales to export'); return; }
    const headers = ['Invoice #', 'Date & Time', 'Customer', 'Items', 'Payment', 'Amount', 'Staff'];
    const rows = sales.map((s) => [
      s.invoiceNumber,
      formatDateTime(s.createdAt),
      s.customer?.name || 'Walk-in',
      s.items?.length || 0,
      s.paymentMethod,
      s.totalAmount,
      s.staff?.name || '',
    ]);
    const esc = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sales exported');
  }

  function printInvoice(sale: any) {
    const win = window.open('', '_blank', 'width=420,height=640');
    if (!win) { toast.error('Allow pop-ups to print the invoice'); return; }
    const itemsHtml = (sale.items || [])
      .map((i: any) => `<tr><td>${i.product?.name || 'Item'} × ${i.quantity}</td><td style="text-align:right">${formatCurrency(i.lineTotal ?? i.unitPrice * i.quantity)}</td></tr>`)
      .join('');
    win.document.write(`<!doctype html><html><head><title>Invoice ${sale.invoiceNumber}</title>
      <style>
        body{font-family:system-ui,Arial,sans-serif;padding:18px;color:#111}
        h1{font-size:18px;margin:0}
        .muted{color:#666;font-size:12px}
        table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
        td{padding:4px 0;border-bottom:1px solid #eee}
        .total td{border:0;font-weight:700;font-size:15px;padding-top:8px}
        .head{border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:8px}
      </style></head><body>
      <div class="head">
        <h1>Maxbuy Ventures</h1>
        <div class="muted">Invoice ${sale.invoiceNumber}</div>
        <div class="muted">${formatDateTime(sale.createdAt)}</div>
      </div>
      <div class="muted">Customer: ${sale.customer?.name || 'Walk-in'}</div>
      <div class="muted">Payment: ${sale.paymentMethod} &nbsp;|&nbsp; Served by: ${sale.staff?.name || '—'}</div>
      <table>${itemsHtml}
        ${sale.discountPct ? `<tr><td>Discount</td><td style="text-align:right">${sale.discountPct}%</td></tr>` : ''}
        <tr class="total"><td>Total</td><td style="text-align:right">${formatCurrency(sale.totalAmount)}</td></tr>
      </table>
      <p class="muted" style="text-align:center;margin-top:18px">Thank you for your patronage!</p>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`);
    win.document.close();
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
          <div className="flex gap-2">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </Select>
            <Button variant="secondary" onClick={exportCsv}><Download size={14} /> Export</Button>
          </div>
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
                        <div className="flex gap-1.5">
                          <button onClick={() => setViewSale(s)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--green-light)] hover:text-[var(--green)]" title="View invoice">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => printInvoice(s)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--blue-light)] hover:text-[var(--blue)]" title="Print invoice">
                            <Printer size={13} />
                          </button>
                        </div>
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

      <Modal
        open={!!viewSale}
        onClose={() => setViewSale(null)}
        title={viewSale ? `Invoice ${viewSale.invoiceNumber}` : 'Invoice'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setViewSale(null)}>Close</Button>
            <Button onClick={() => viewSale && printInvoice(viewSale)}><Printer size={14} /> Print</Button>
          </>
        }
      >
        {viewSale && (
          <div className="flex flex-col gap-3 text-[13px]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[var(--text-muted)]">
              <span>{formatDateTime(viewSale.createdAt)}</span>
              {payBadge(viewSale.paymentMethod)}
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg)] p-3">
              <div><span className="text-[var(--text-muted)]">Customer:</span> <strong>{viewSale.customer?.name || 'Walk-in'}</strong></div>
              <div><span className="text-[var(--text-muted)]">Served by:</span> <strong>{viewSale.staff?.name || '—'}</strong></div>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Item', 'Qty', 'Unit', 'Total'].map((h) => (
                    <th key={h} className="border-b border-[var(--border)] pb-1.5 text-left text-[11px] font-semibold uppercase text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(viewSale.items || []).map((i: any, idx: number) => (
                  <tr key={idx} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-1.5">{i.product?.name || 'Item'}</td>
                    <td className="py-1.5">{i.quantity}</td>
                    <td className="py-1.5">{formatCurrency(i.unitPrice)}</td>
                    <td className="py-1.5 font-medium">{formatCurrency(i.lineTotal ?? i.unitPrice * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-2">
              {!!viewSale.discountPct && (
                <div className="flex justify-between text-[var(--text-muted)]"><span>Discount</span><span>{viewSale.discountPct}%</span></div>
              )}
              <div className="flex justify-between text-[15px] font-bold"><span>Total</span><span>{formatCurrency(viewSale.totalAmount)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
