'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Truck, Phone, Trash2, Edit } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button, Badge, Modal, Input, FormGroup } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Supplier } from '@/types';

const INITIAL = { name: '', contactName: '', phone: '', email: '', productsSupplied: '' };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await apiFetch<{ suppliers: any[] }>('/api/suppliers');
      setSuppliers(res.suppliers);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  function setF(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.name) { toast.error('Supplier name is required'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/suppliers', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Supplier added!');
      setModalOpen(false);
      setForm(INITIAL);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Topbar title="Suppliers" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Suppliers</h2>
            <p className="text-[13px] text-[var(--text-muted)]">Manage your product suppliers and purchase relationships</p>
          </div>
          <Button onClick={() => setModalOpen(true)}><Plus size={14} /> Add Supplier</Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Supplier', 'Contact', 'Phone', 'Products Supplied', 'Last Order', 'Balance', 'Actions'].map((h) => (
                    <th key={h} className="border-b-2 border-[var(--border)] pb-2 pr-4 pt-1 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="py-8 text-center text-sm text-[var(--text-muted)]">Loading suppliers…</td></tr>}
                {!loading && suppliers.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--bg)]">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--blue-light)] text-[var(--blue)]">
                          <Truck size={14} />
                        </div>
                        <span className="text-[13px] font-semibold">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-[13px]">{s.contactName || '—'}</td>
                    <td className="py-3 pr-4 text-[13px]">{s.phone || '—'}</td>
                    <td className="py-3 pr-4 text-[12px] text-[var(--text-muted)]">{s.productsSupplied || '—'}</td>
                    <td className="py-3 pr-4 text-[12px]">{s.lastOrderAt ? formatDate(s.lastOrderAt) : 'Never'}</td>
                    <td className="py-3 pr-4">
                      {s.balanceOwed > 0
                        ? <Badge color="amber">₦{s.balanceOwed.toLocaleString()}</Badge>
                        : <Badge color="green">Clear</Badge>}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1.5">
                        {s.phone && (
                          <a href={`tel:${s.phone}`}>
                            <Button variant="secondary" size="sm"><Phone size={12} /></Button>
                          </a>
                        )}
                        <Button variant="danger" size="sm"><Trash2 size={12} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && suppliers.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-[var(--text-muted)]">No suppliers yet. Add your first supplier.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Supplier"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Supplier'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormGroup label="Supplier / Company Name *">
            <Input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="e.g. Dabiri Foods Ltd" />
          </FormGroup>
          <FormGroup label="Contact Person">
            <Input value={form.contactName} onChange={(e) => setF('contactName', e.target.value)} placeholder="Full name" />
          </FormGroup>
          <FormGroup label="Phone">
            <Input value={form.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="+234 xxx xxx xxxx" />
          </FormGroup>
          <FormGroup label="Email">
            <Input type="email" value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="supplier@email.com" />
          </FormGroup>
          <FormGroup label="Products / Categories Supplied">
            <Input value={form.productsSupplied} onChange={(e) => setF('productsSupplied', e.target.value)} placeholder="e.g. Beverages, Groceries" className="sm:col-span-2" />
          </FormGroup>
        </div>
      </Modal>
    </>
  );
}
