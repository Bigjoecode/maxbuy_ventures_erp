'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HandCoins, Clock, Users, CheckCircle, Plus, MessageCircle, Check, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button, Modal, FormGroup, Input, Select, Badge } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';

const EMPTY = { customerId: '', amount: '', dueDate: '', description: '' };

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [payModal, setPayModal] = useState<{ open: boolean; debt: any | null }>({ open: false, debt: null });
  const [form, setForm] = useState(EMPTY);
  const [payAmount, setPayAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); loadCustomers(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ debts: any[] }>('/api/debts');
      setDebts(res.debts);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function loadCustomers() {
    try {
      const res = await apiFetch<{ customers: any[] }>('/api/customers');
      setCustomers(res.customers);
    } catch {}
  }

  async function handleSave() {
    if (!form.customerId || !form.amount) { toast.error('Customer and amount are required'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/debts', {
        method: 'POST',
        body: JSON.stringify({
          customerId: form.customerId,
          amount: parseFloat(form.amount),
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
          description: form.description || null,
        }),
      });
      toast.success('Debt recorded!');
      setModalOpen(false);
      setForm(EMPTY);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function handleMarkPaid(debt: any) {
    const balance = debt.amount - debt.amountPaid;
    if (balance <= 0) { toast('Already settled'); return; }
    try {
      await apiFetch(`/api/debts/${debt.id}`, { method: 'PATCH', body: JSON.stringify({ amountPaid: balance }) });
      toast.success('Marked as fully paid!');
      load();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleDelete(debt: any) {
    if (!confirm(`Permanently delete this debt of ${formatCurrency(debt.amount)} for ${debt.customer?.name || 'customer'}? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/debts/${debt.id}`, { method: 'DELETE' });
      toast.success('Debt deleted');
      load();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handlePartialPay() {
    if (!payModal.debt || !payAmount) return;
    setSaving(true);
    try {
      await apiFetch(`/api/debts/${payModal.debt.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ amountPaid: parseFloat(payAmount) }),
      });
      toast.success('Payment recorded!');
      setPayModal({ open: false, debt: null });
      setPayAmount('');
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  const totalOwed = debts.reduce((s, d) => s + (d.amount - d.amountPaid), 0);
  const overdue = debts.filter((d) => d.dueDate && daysUntil(d.dueDate) < 0);
  const overdueAmt = overdue.reduce((s, d) => s + (d.amount - d.amountPaid), 0);
  const debtorsCount = new Set(debts.map((d) => d.customerId)).size;

  const f = (field: string) => (e: any) => setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <>
      <Topbar title="Debts & Credits" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Debt & Credit Management</h2>
            <p className="text-[13px] text-[var(--text-muted)]">Track what customers owe and send payment reminders</p>
          </div>
          <Button onClick={() => setModalOpen(true)}><Plus size={14} /> Record Debt</Button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <StatCard label="Total Owed" value={formatCurrency(totalOwed)} icon={HandCoins} color="red" />
          <StatCard label="Overdue" value={formatCurrency(overdueAmt)} sub={`${overdue.length} accounts`} icon={Clock} color="amber" />
          <StatCard label="Debtors" value={debtorsCount} icon={Users} color="blue" />
          <StatCard label="Debts Tracked" value={debts.length} icon={CheckCircle} color="green" />
        </div>

        <Card>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading debts...</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {['Customer', 'Phone', 'Amount Owed', 'Paid', 'Balance', 'Due Date', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="border-b-2 border-[var(--border)] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {debts.map((d) => {
                    const balance = d.amount - d.amountPaid;
                    const days = d.dueDate ? daysUntil(d.dueDate) : null;
                    const isOverdue = days !== null && days < 0;
                    return (
                      <tr key={d.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]">
                        <td className="px-3 py-2.5 font-medium text-[13px]">{d.customer?.name || '—'}</td>
                        <td className="px-3 py-2.5 text-[12px] text-[var(--text-muted)]">{d.customer?.phone || '—'}</td>
                        <td className="px-3 py-2.5 font-bold text-[13px]">{formatCurrency(d.amount)}</td>
                        <td className="px-3 py-2.5 text-[13px] text-[var(--green)]">{formatCurrency(d.amountPaid)}</td>
                        <td className="px-3 py-2.5 font-bold text-[var(--red)] text-[13px]">{formatCurrency(balance)}</td>
                        <td className="px-3 py-2.5 text-[12px]">{d.dueDate ? formatDate(d.dueDate) : '—'}</td>
                        <td className="px-3 py-2.5">
                          {isOverdue
                            ? <Badge color="red">Overdue {Math.abs(days!)}d</Badge>
                            : <Badge color="amber">Pending</Badge>}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1.5">
                            <Button size="sm" onClick={() => handleMarkPaid(d)} title="Mark fully paid"><Check size={12} /> Paid</Button>
                            <Button variant="secondary" size="sm" onClick={() => { setPayModal({ open: true, debt: d }); setPayAmount(''); }} title="Partial payment">Partial</Button>
                            {d.customer?.phone && (
                              <Button variant="amber" size="sm" onClick={() => window.open(`https://wa.me/${d.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${d.customer.name}, this is a payment reminder for ₦${balance.toLocaleString()} owed to Maxbuy Ventures. Please make payment at your earliest convenience. Thank you.`)}`)}>
                                <MessageCircle size={12} />
                              </Button>
                            )}
                            <Button variant="danger" size="sm" onClick={() => handleDelete(d)} title="Delete debt"><Trash2 size={12} /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {debts.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-[var(--text-muted)]">No outstanding debts</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Customer Debt"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Debt'}</Button></>}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormGroup label="Customer">
            <Select value={form.customerId} onChange={f('customerId')}>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Amount (₦)"><Input type="number" value={form.amount} onChange={f('amount')} placeholder="0.00" /></FormGroup>
          <FormGroup label="Due Date"><Input type="date" value={form.dueDate} onChange={f('dueDate')} /></FormGroup>
          <FormGroup label="Description"><Input value={form.description} onChange={f('description')} placeholder="For what?" /></FormGroup>
        </div>
      </Modal>

      <Modal open={payModal.open} onClose={() => setPayModal({ open: false, debt: null })} title="Record Partial Payment"
        footer={<><Button variant="secondary" onClick={() => setPayModal({ open: false, debt: null })}>Cancel</Button><Button onClick={handlePartialPay} disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</Button></>}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[var(--text-muted)]">
            Recording payment for <strong>{payModal.debt?.customer?.name}</strong>.
            Balance: <strong className="text-[var(--red)]">{formatCurrency((payModal.debt?.amount || 0) - (payModal.debt?.amountPaid || 0))}</strong>
          </p>
          <FormGroup label="Amount Paid (₦)">
            <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" autoFocus />
          </FormGroup>
        </div>
      </Modal>
    </>
  );
}
