'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Undo2, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/apiClient';

interface Trashed {
  id: string;
  name: string;
  phone?: string | null;
  sku?: string | null;
  username?: string | null;
  deletedAt: string;
}

type Resource = 'product' | 'customer' | 'supplier' | 'staff';

export default function RecycleBinPage() {
  const [data, setData] = useState<{ products: Trashed[]; customers: Trashed[]; suppliers: Trashed[]; staff: Trashed[] }>({
    products: [],
    customers: [],
    suppliers: [],
    staff: [],
  });
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await apiFetch<typeof data>('/api/admin/trash');
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Could not load recycle bin');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function restore(resource: Resource, id: string) {
    try {
      await apiFetch('/api/admin/restore', { method: 'POST', body: JSON.stringify({ resource, id }) });
      toast.success('Restored');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Restore failed');
    }
  }

  const empty =
    !loading &&
    data.products.length === 0 &&
    data.customers.length === 0 &&
    data.suppliers.length === 0 &&
    data.staff.length === 0;

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
            <div key={it.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[var(--text)]">{it.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {it.phone || it.sku || it.username || ''} · deleted {new Date(it.deletedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => restore(resource, it.id)}
                className="flex items-center gap-1 rounded-lg border border-[var(--green)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--green)] hover:bg-[var(--green)] hover:text-white"
              >
                <Undo2 size={13} /> Restore
              </button>
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
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Recycle Bin</h2>
          <p className="text-[13px] text-[var(--text-muted)]">Recover items that were deleted. Records are never hard-deleted.</p>
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
          </div>
        )}
      </div>
    </>
  );
}
