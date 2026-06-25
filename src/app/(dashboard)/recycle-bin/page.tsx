'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Undo2, Trash2, XCircle } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';

interface Trashed {
  id: string;
  name: string;
  phone?: string | null;
  sku?: string | null;
  username?: string | null;
  detail?: string | null;
  deletedAt: string;
}

type Resource = 'product' | 'customer' | 'supplier' | 'staff' | 'debt' | 'expense';

interface TrashData {
  products: Trashed[];
  customers: Trashed[];
  suppliers: Trashed[];
  staff: Trashed[];
  debts: Trashed[];
  expenses: Trashed[];
}

const EMPTY_DATA: TrashData = { products: [], customers: [], suppliers: [], staff: [], debts: [], expenses: [] };

export default function RecycleBinPage() {
  const [data, setData] = useState<TrashData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const isSuperAdmin = useAuthStore((s) => s.user?.role) === 'SUPER_ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<TrashData>('/api/admin/trash');
      setData({ ...EMPTY_DATA, ...res });
    } catch (err: any) {
      toast.error(err.message || 'Could not load recycle bin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(resource: Resource, id: string) {
    try {
      await apiFetch('/api/admin/restore', { method: 'POST', body: JSON.stringify({ resource, id }) });
      toast.success('Restored');
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Restore failed');
    }
  }

  async function purge(resource: Resource, id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiFetch('/api/admin/trash', { method: 'DELETE', body: JSON.stringify({ resource, id }) });
      toast.success('Permanently deleted');
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Permanent delete failed');
    }
  }

  async function emptyBin() {
    const total = Object.values(data).reduce((s, arr) => s + arr.length, 0);
    if (total === 0) return;
    if (!confirm(`Permanently delete all ${total} item(s) in the recycle bin? This cannot be undone.`)) return;
    setPurging(true);
    try {
      const res = await apiFetch<{ removed: number; skipped: number }>('/api/admin/trash', {
        method: 'DELETE',
        body: JSON.stringify({ all: true }),
      });
      toast.success(
        `Removed ${res.removed} item(s)` + (res.skipped ? `; ${res.skipped} kept (linked history)` : '')
      );
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Could not empty the recycle bin');
    } finally {
      setPurging(false);
    }
  }

  const total = Object.values(data).reduce((s, arr) => s + arr.length, 0);
  const empty = !loading && total === 0;

  const Section = ({ title, items, resource }: { title: string; items: Trashed[]; resource: Resource }) => (
    <Card>
      <CardTitle icon={Trash2}>
        {title} ({items.length})
      </CardTitle>
      {items.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">Nothing here.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[var(--text)]">{it.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {it.detail || it.phone || it.sku || it.username || ''} · deleted {new Date(it.deletedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => restore(resource, it.id)}
                  className="flex items-center gap-1 rounded-lg border border-[var(--green)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--green)] hover:bg-[var(--green)] hover:text-white"
                >
                  <Undo2 size={13} /> Restore
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => purge(resource, it.id, it.name)}
                    title="Delete permanently"
                    className="flex items-center gap-1 rounded-lg border border-[var(--red)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--red)] hover:bg-[var(--red)] hover:text-white"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <>
      <Topbar title="Recycle Bin" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Recycle Bin</h2>
            <p className="text-[13px] text-[var(--text-muted)]">
              Recover deleted items. {isSuperAdmin ? 'As super admin you can also delete them permanently.' : 'Restored items return to their page.'}
            </p>
          </div>
          {isSuperAdmin && total > 0 && (
            <Button variant="danger" onClick={emptyBin} disabled={purging}>
              <XCircle size={14} /> {purging ? 'Emptying…' : 'Empty Recycle Bin'}
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : empty ? (
          <Card>
            <p className="py-6 text-center text-[13px] text-[var(--text-muted)]">🎉 The recycle bin is empty.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Products" items={data.products} resource="product" />
            <Section title="Customers" items={data.customers} resource="customer" />
            <Section title="Suppliers" items={data.suppliers} resource="supplier" />
            <Section title="Staff" items={data.staff} resource="staff" />
            <Section title="Debts" items={data.debts} resource="debt" />
            <Section title="Expenses" items={data.expenses} resource="expense" />
          </div>
        )}
      </div>
    </>
  );
}
