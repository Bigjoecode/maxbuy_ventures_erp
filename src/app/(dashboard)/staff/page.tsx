'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserCog, Plus, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button, Modal, FormGroup, Input, Select, Badge } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatDateTime } from '@/lib/utils';
import { Staff, Role } from '@/types';

const ROLES: Role[] = ['SUPER_ADMIN','MANAGER','CASHIER','STOCK_KEEPER','SALES_REP'];
const ROLE_LABEL: Record<string, string> = { SUPER_ADMIN: 'Super Admin', MANAGER: 'Manager', CASHIER: 'Cashier', STOCK_KEEPER: 'Stock Keeper', SALES_REP: 'Sales Rep' };
const EMPTY = { name: '', username: '', password: '', phone: '', role: 'CASHIER' };

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ staff: Staff[] }>('/api/staff');
      setStaff(res.staff);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.name || !form.username || !form.password) { toast.error('Name, username and password are required'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/staff', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Staff member added!');
      setModalOpen(false);
      setForm(EMPTY);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  const roleBadge = (r: string) => {
    const map: Record<string, any> = { SUPER_ADMIN: 'red', MANAGER: 'purple', CASHIER: 'blue', STOCK_KEEPER: 'green', SALES_REP: 'amber' };
    return <Badge color={map[r] || 'gray'}>{ROLE_LABEL[r] || r}</Badge>;
  };

  const f = (field: string) => (e: any) => setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <>
      <Topbar title="Staff & Roles" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Staff & User Roles</h2>
            <p className="text-[13px] text-[var(--text-muted)]">Manage staff accounts and access permissions</p>
          </div>
          <Button onClick={() => setModalOpen(true)}><Plus size={14} /> Add Staff</Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading staff...</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {['Name', 'Role', 'Username', 'Phone', 'Status', 'Last Active'].map((h) => (
                      <th key={h} className="border-b-2 border-[var(--border)] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]">
                      <td className="px-3 py-2.5 font-medium text-[13px]">{s.name}</td>
                      <td className="px-3 py-2.5">{roleBadge(s.role)}</td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--text-muted)]">{s.username}</td>
                      <td className="px-3 py-2.5 text-[13px]">{s.phone || '—'}</td>
                      <td className="px-3 py-2.5"><Badge color={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="px-3 py-2.5 text-[12px] text-[var(--text-muted)]">{s.lastActiveAt ? formatDateTime(s.lastActiveAt) : 'Never'}</td>
                    </tr>
                  ))}
                  {staff.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-[var(--text-muted)]">No staff found</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Permissions reference */}
        <Card className="mt-4">
          <h3 className="mb-3 font-display text-sm font-bold">Role Permission Reference</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { role: 'SUPER_ADMIN', perms: 'Full access to everything' },
              { role: 'MANAGER', perms: 'POS, Inventory, Sales, Expenses, Debts, Customers, Reports, Suppliers' },
              { role: 'CASHIER', perms: 'POS, Sales, Customers' },
              { role: 'STOCK_KEEPER', perms: 'Inventory, Suppliers, Expiry Tracker' },
              { role: 'SALES_REP', perms: 'POS, Customers, Debts' },
            ].map((r) => (
              <div key={r.role} className="rounded-lg bg-[var(--bg)] p-3">
                <div className="mb-1">{roleBadge(r.role)}</div>
                <p className="text-[12px] text-[var(--text-muted)]">{r.perms}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Member"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Add Staff'}</Button></>}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormGroup label="Full Name *"><Input value={form.name} onChange={f('name')} placeholder="Staff name" /></FormGroup>
          <FormGroup label="Role">
            <Select value={form.role} onChange={f('role')}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Username *"><Input value={form.username} onChange={f('username')} placeholder="Login username" /></FormGroup>
          <FormGroup label="Phone"><Input value={form.phone} onChange={f('phone')} placeholder="+234..." /></FormGroup>
          <FormGroup label="Password *"><Input type="password" value={form.password} onChange={f('password')} placeholder="Min 6 characters" className="sm:col-span-2" /></FormGroup>
        </div>
      </Modal>
    </>
  );
}
