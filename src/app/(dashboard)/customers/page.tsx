'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Phone, MessageCircle, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button, Modal, FormGroup, Input, Select, Badge } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/utils';
import { Customer } from '@/types';

const EMPTY = { name: '', phone: '', email: '', address: '', type: 'RETAIL' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ customers: (Customer & { debts: any[] })[] }>('/api/customers');
      setCustomers(res.customers);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  async function handleSave() {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Customer added!');
      setModalOpen(false);
      setForm(EMPTY);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/customers/${id}`, { method: 'DELETE' });
      toast.success('Customer removed');
      load();
    } catch (err: any) { toast.error(err.message); }
  }

  const typeBadge = (t: string) => {
    const map: Record<string, any> = { VIP: 'amber', WHOLESALE: 'purple', RETAIL: 'blue' };
    return <Badge color={map[t] || 'gray'}>{t}</Badge>;
  };

  const f = (field: string) => (e: any) => setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <>
      <Topbar title="Customers" onSearch={setSearch} />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Customer Management</h2>
            <p className="text-[13px] text-[var(--text-muted)]">Manage customer profiles and purchase history</p>
          </div>
          <Button onClick={() => setModalOpen(true)}><UserPlus size={14} /> Add Customer</Button>
        </div>

        <Card>
          <div className="mb-4">
            <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading customers...</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {['Name', 'Phone', 'Type', 'Total Spent', 'Points', 'Last Purchase', 'Debt', 'Actions'].map((h) => (
                      <th key={h} className="border-b-2 border-[var(--border)] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c: any) => {
                    const debtAmt = (c.debts || []).reduce((s: number, d: any) => s + (d.amount - d.amountPaid), 0);
                    return (
                      <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]">
                        <td className="px-3 py-2.5 font-medium text-[13px]">{c.name}</td>
                        <td className="px-3 py-2.5 text-[13px]">{c.phone}</td>
                        <td className="px-3 py-2.5">{typeBadge(c.type)}</td>
                        <td className="px-3 py-2.5 font-bold text-[var(--green)] text-[13px]">{formatCurrency(c.totalSpent)}</td>
                        <td className="px-3 py-2.5"><Badge color="amber">⭐ {c.loyaltyPoints.toLocaleString()}</Badge></td>
                        <td className="px-3 py-2.5 text-[12px] text-[var(--text-muted)]">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2.5">
                          {debtAmt > 0
                            ? <Badge color="red">{formatCurrency(debtAmt)}</Badge>
                            : <Badge color="green">Clear</Badge>}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1.5">
                            <Button variant="secondary" size="sm" onClick={() => window.open(`tel:${c.phone}`)} title="Call"><Phone size={12} /></Button>
                            <Button variant="amber" size="sm" onClick={() => window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}`)} title="WhatsApp"><MessageCircle size={12} /></Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(c.id, c.name)}><Trash2 size={12} /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-sm text-[var(--text-muted)]">No customers found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Customer"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Customer'}</Button></>}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormGroup label="Full Name *"><Input value={form.name} onChange={f('name')} placeholder="Customer name" /></FormGroup>
          <FormGroup label="Phone *"><Input value={form.phone} onChange={f('phone')} placeholder="+234..." /></FormGroup>
          <FormGroup label="Email"><Input type="email" value={form.email} onChange={f('email')} placeholder="email@example.com" /></FormGroup>
          <FormGroup label="Customer Type">
            <Select value={form.type} onChange={f('type')}>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="VIP">VIP</option>
            </Select>
          </FormGroup>
          <FormGroup label="Address"><Input value={form.address} onChange={f('address')} placeholder="Customer address" className="sm:col-span-2" /></FormGroup>
        </div>
      </Modal>
    </>
  );
}
