'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet, CalendarDays, Sun, TrendingUp, Plus, Trash2, Edit } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button, Modal, FormGroup, Input, Select, Badge } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency, formatDate } from '@/lib/utils';

const CATEGORIES = ['RENT','ELECTRICITY','TRANSPORT','STAFF_SALARY','RESTOCKING','REPAIRS','OTHER'];
const EMPTY = { category: 'OTHER', description: '', amount: '', date: new Date().toISOString().split('T')[0] };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (currentPeriod: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ expenses: any[] }>(`/api/expenses?period=${currentPeriod}`);
      setExpenses(res.expenses);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(period); }, [period, load]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  }

  function openEdit(e: any) {
    setEditingId(e.id);
    setForm({
      category: e.category,
      description: e.description || '',
      amount: String(e.amount),
      date: new Date(e.date).toISOString().split('T')[0],
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.amount) { toast.error('Amount is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), date: new Date(form.date).toISOString() };
      if (editingId) {
        await apiFetch(`/api/expenses/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast.success('Expense updated!');
      } else {
        await apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Expense recorded!');
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY);
      await load(period);
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(e: any) {
    if (!confirm(`Delete this ${catLabel(e.category)} expense of ${formatCurrency(e.amount)}? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/expenses/${e.id}`, { method: 'DELETE' });
      toast.success('Expense deleted');
      await load(period);
    } catch (err: any) { toast.error(err.message); }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const todayAmt = expenses.filter((e) => new Date(e.date).toDateString() === new Date().toDateString()).reduce((s, e) => s + e.amount, 0);
  const catMap: Record<string, number> = {};
  expenses.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  const catLabel = (cat: string) => cat.replace(/_/g, ' ');

  const catBadge = (cat: string) => {
    const colorMap: Record<string, any> = { RENT: 'red', ELECTRICITY: 'amber', TRANSPORT: 'blue', STAFF_SALARY: 'purple', RESTOCKING: 'green', REPAIRS: 'amber', OTHER: 'gray' };
    return <Badge color={colorMap[cat] || 'gray'}>{catLabel(cat)}</Badge>;
  };

  const f = (field: string) => (e: any) => setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <>
      <Topbar title="Expenses" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Expense Tracker</h2>
            <p className="text-[13px] text-[var(--text-muted)]">Track all business expenses and outflows</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </Select>
            <Button onClick={openAdd}><Plus size={14} /> Add Expense</Button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <StatCard label="Total Expenses" value={formatCurrency(total)} icon={Wallet} color="red" />
          <StatCard label="Today" value={formatCurrency(todayAmt)} icon={Sun} color="amber" />
          <StatCard label="Transactions" value={expenses.length} icon={CalendarDays} color="blue" />
          <StatCard label="Top Category" value={topCat ? catLabel(topCat[0]) : '—'} sub={topCat ? formatCurrency(topCat[1]) : ''} icon={TrendingUp} color="purple" />
        </div>

        <Card>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading expenses...</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {['Date', 'Category', 'Description', 'Amount', 'Recorded By', 'Actions'].map((h) => (
                      <th key={h} className="border-b-2 border-[var(--border)] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]">
                      <td className="px-3 py-2.5 text-[12px] text-[var(--text-muted)]">{formatDate(e.date)}</td>
                      <td className="px-3 py-2.5">{catBadge(e.category)}</td>
                      <td className="px-3 py-2.5 text-[13px]">{e.description || '—'}</td>
                      <td className="px-3 py-2.5 font-bold text-[var(--red)] text-[13px]">{formatCurrency(e.amount)}</td>
                      <td className="px-3 py-2.5 text-[12px] text-[var(--text-muted)]">{e.recordedBy?.name || '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(e)} title="Edit expense"><Edit size={12} /></Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(e)} title="Delete expense"><Trash2 size={12} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-[var(--text-muted)]">No expenses recorded for this period</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Expense' : 'Record Expense'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Expense' : 'Record Expense'}</Button></>}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormGroup label="Category">
            <Select value={form.category} onChange={f('category')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Amount (₦)"><Input type="number" value={form.amount} onChange={f('amount')} placeholder="0.00" /></FormGroup>
          <FormGroup label="Description"><Input value={form.description} onChange={f('description')} placeholder="Brief description" /></FormGroup>
          <FormGroup label="Date"><Input type="date" value={form.date} onChange={f('date')} /></FormGroup>
        </div>
      </Modal>
    </>
  );
}
