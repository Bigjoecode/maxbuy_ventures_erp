'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarX, Ban, AlertTriangle, Calendar, CheckCircle2, Plus, Edit, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge, Button, Modal, FormGroup, Input, Select } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatDate, daysUntil, getExpiryStatus } from '@/lib/utils';
import { Product } from '@/types';

const CATEGORY_EMOJI: Record<string, string> = { Groceries:'🌾', Beverages:'🥤', 'Baby Feeds':'👶', Toiletries:'🧴', Cartons:'📦', Household:'🏠' };
const EMPTY = { productId: '', expiryDate: '' };

export default function ExpiryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ products: Product[] }>('/api/products');
      setProducts(res.products);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  const tracked = products.filter((p) => !!p.expiryDate);
  const withDays = tracked
    .map((p) => ({ ...p, days: daysUntil(p.expiryDate!), status: getExpiryStatus(p.expiryDate) }))
    .sort((a, b) => a.days - b.days);

  const counts = { expired: withDays.filter((p) => p.days < 0).length, critical: withDays.filter((p) => p.days >= 0 && p.days <= 7).length, warning: withDays.filter((p) => p.days > 7 && p.days <= 30).length, good: withDays.filter((p) => p.days > 30).length };

  const statusBadge = (status: string | null) => {
    if (status === 'expired') return <Badge color="red">Expired</Badge>;
    if (status === 'critical') return <Badge color="red">Critical</Badge>;
    if (status === 'warning') return <Badge color="amber">Warning</Badge>;
    return <Badge color="green">Good</Badge>;
  };

  function openAdd() {
    setEditingName(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditingName(p.name);
    setForm({ productId: p.id, expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : '' });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.productId) { toast.error('Select a product'); return; }
    if (!form.expiryDate) { toast.error('Set an expiry date'); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/products/${form.productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ expiryDate: new Date(form.expiryDate).toISOString() }),
      });
      toast.success(editingName ? 'Expiry date updated' : 'Expiry tracking added');
      setModalOpen(false);
      setForm(EMPTY);
      setEditingName(null);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function handleRemove(p: Product) {
    if (!confirm(`Stop tracking expiry for "${p.name}"? The product itself is not deleted.`)) return;
    try {
      await apiFetch(`/api/products/${p.id}`, { method: 'PATCH', body: JSON.stringify({ expiryDate: null }) });
      toast.success('Removed from expiry tracker');
      load();
    } catch (err: any) { toast.error(err.message); }
  }

  const untracked = products.filter((p) => !p.expiryDate);

  return (
    <>
      <Topbar title="Expiry Tracker" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Expiry Tracker</h2>
            <p className="text-[13px] text-[var(--text-muted)]">Monitor product expiry dates to avoid losses</p>
          </div>
          <Button onClick={openAdd}><Plus size={14} /> Track Expiry</Button>
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
                    {['Product', 'Category', 'Stock', 'Expiry Date', 'Days Left', 'Status', 'Actions'].map((h) => (
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
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(p)} title="Edit expiry date"><Edit size={12} /></Button>
                          <Button variant="danger" size="sm" onClick={() => handleRemove(p)} title="Stop tracking"><Trash2 size={12} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {withDays.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-sm text-[var(--text-muted)]">No products with expiry dates tracked. Use “Track Expiry” to add one.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingName ? `Edit Expiry — ${editingName}` : 'Track Product Expiry'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editingName ? 'Update' : 'Add Tracking'}</Button></>}>
        <div className="grid grid-cols-1 gap-3.5">
          <FormGroup label="Product">
            <Select value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))} disabled={!!editingName}>
              <option value="">Select a product</option>
              {editingName
                ? products.filter((p) => p.id === form.productId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                : untracked.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Expiry Date">
            <Input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
          </FormGroup>
          {!editingName && untracked.length === 0 && (
            <p className="text-[12px] text-[var(--text-muted)]">All products already have an expiry date tracked.</p>
          )}
        </div>
      </Modal>
    </>
  );
}
