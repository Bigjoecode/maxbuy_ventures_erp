'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, ArrowRightLeft, Star } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button, FormGroup, Input, Select } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { Product } from '@/types';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isMain: boolean;
  _count?: { staff: number; products: number; sales: number };
}

interface Transfer {
  id: string;
  productName: string;
  quantity: number;
  createdAt: string;
  fromBranch: { name: string };
  toBranch: { name: string };
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' });
  const [xfer, setXfer] = useState({ sourceProductId: '', toBranchId: '', quantity: 1 });
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    try {
      const [b, p, t] = await Promise.all([
        apiFetch<{ branches: Branch[] }>('/api/branches'),
        apiFetch<{ products: Product[] }>('/api/products'),
        apiFetch<{ transfers: Transfer[] }>('/api/stock-transfers'),
      ]);
      setBranches(b.branches);
      setProducts(p.products);
      setTransfers(t.transfers);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!newBranch.name) return;
    setBusy(true);
    try {
      await apiFetch('/api/branches', { method: 'POST', body: JSON.stringify(newBranch) });
      toast.success('Branch added');
      setNewBranch({ name: '', address: '', phone: '' });
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Could not add branch');
    } finally {
      setBusy(false);
    }
  }

  async function setMain(id: string) {
    try {
      await apiFetch(`/api/branches/${id}`, { method: 'PATCH', body: JSON.stringify({ isMain: true }) });
      toast.success('Main branch updated');
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function doTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!xfer.sourceProductId || !xfer.toBranchId || xfer.quantity < 1) {
      toast.error('Pick a product, destination branch and quantity');
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/api/stock-transfers', { method: 'POST', body: JSON.stringify(xfer) });
      toast.success('Stock transferred');
      setXfer({ sourceProductId: '', toBranchId: '', quantity: 1 });
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Topbar title="Branches" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Branches & Transfers</h2>
          <p className="text-[13px] text-[var(--text-muted)]">Manage locations and move stock between them.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Branch list */}
          <Card>
            <CardTitle icon={Building2}>Branches ({branches.length})</CardTitle>
            <div className="space-y-2">
              {branches.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
                  <div>
                    <p className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text)]">
                      {b.name}
                      {b.isMain && <span className="rounded-full bg-[var(--green-light)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--green-dark)]">MAIN</span>}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {b.address || 'No address'} · {b._count?.products ?? 0} products · {b._count?.staff ?? 0} staff
                    </p>
                  </div>
                  {!b.isMain && (
                    <button onClick={() => setMain(b.id)} title="Set as main" className="flex items-center gap-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--green)]">
                      <Star size={13} /> Set main
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={addBranch} className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <FormGroup label="Name"><Input value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} placeholder="Branch name" /></FormGroup>
                <FormGroup label="Address"><Input value={newBranch.address} onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })} placeholder="Optional" /></FormGroup>
                <FormGroup label="Phone"><Input value={newBranch.phone} onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })} placeholder="Optional" /></FormGroup>
              </div>
              <Button type="submit" disabled={busy || !newBranch.name}>Add Branch</Button>
            </form>
          </Card>

          {/* Stock transfer */}
          <Card>
            <CardTitle icon={ArrowRightLeft}>Transfer Stock</CardTitle>
            <form onSubmit={doTransfer} className="space-y-2">
              <FormGroup label="Product (from your branch)">
                <Select value={xfer.sourceProductId} onChange={(e) => setXfer({ ...xfer, sourceProductId: e.target.value })}>
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.stockQuantity} {p.unit} in stock</option>
                  ))}
                </Select>
              </FormGroup>
              <div className="grid grid-cols-2 gap-2">
                <FormGroup label="To branch">
                  <Select value={xfer.toBranchId} onChange={(e) => setXfer({ ...xfer, toBranchId: e.target.value })}>
                    <option value="">Destination…</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup label="Quantity">
                  <Input type="number" min={1} value={xfer.quantity} onChange={(e) => setXfer({ ...xfer, quantity: Number(e.target.value) })} />
                </FormGroup>
              </div>
              <Button type="submit" disabled={busy}>Transfer</Button>
            </form>

            <div className="mt-4 border-t border-[var(--border)] pt-3">
              <p className="mb-2 text-[12px] font-semibold text-[var(--text-muted)]">Recent transfers</p>
              {transfers.length === 0 ? (
                <p className="text-[12px] text-[var(--text-muted)]">No transfers yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {transfers.slice(0, 8).map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-[12px]">
                      <span className="text-[var(--text)]">{t.quantity} × {t.productName}</span>
                      <span className="text-[var(--text-muted)]">{t.fromBranch.name} → {t.toBranch.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
