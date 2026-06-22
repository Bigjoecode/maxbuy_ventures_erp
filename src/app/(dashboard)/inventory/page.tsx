'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Boxes, AlertTriangle, XCircle, CalendarX } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button, Modal, FormGroup, Input, Select, Badge } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency, getStockStatus, getExpiryStatus, formatDate } from '@/lib/utils';
import { Product } from '@/types';

const CATEGORIES = ['Groceries', 'Beverages', 'Baby Feeds', 'Toiletries', 'Cartons', 'Household'];
const UNITS = ['Piece', 'Carton', 'Pack', 'Bag', 'Bottle', 'Kg', 'Tin'];

const EMPTY_FORM = {
  name: '', categoryId: '', supplierId: '', costPrice: '', sellingPrice: '',
  unit: 'Piece', unitsPerCarton: '', stockQuantity: '', lowStockAlert: '10',
  expiryDate: '', barcode: '', sku: '',
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        apiFetch<{ products: Product[] }>('/api/products'),
        apiFetch<{ categories: { id: string; name: string }[] }>('/api/categories').catch(() => ({ categories: [] })),
      ]);
      setProducts(prodRes.products);
      setCategories(catRes.categories);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function filtered() {
    return products.filter((p) => {
      const s = search.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(s) || (p.barcode || '').toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s);
      const matchCat = !catFilter || p.category?.name === catFilter;
      const st = getStockStatus(p.stockQuantity, p.lowStockAlert);
      const matchStatus = !statusFilter || st === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      categoryId: p.categoryId,
      supplierId: p.supplierId || '',
      costPrice: String(p.costPrice),
      sellingPrice: String(p.sellingPrice),
      unit: p.unit,
      unitsPerCarton: String(p.unitsPerCarton || ''),
      stockQuantity: String(p.stockQuantity),
      lowStockAlert: String(p.lowStockAlert),
      expiryDate: p.expiryDate ? p.expiryDate.split('T')[0] : '',
      barcode: p.barcode || '',
      sku: p.sku || '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.sellingPrice) { toast.error('Name and selling price are required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        categoryId: form.categoryId || categories[0]?.id,
        supplierId: form.supplierId || null,
        costPrice: parseFloat(form.costPrice) || 0,
        sellingPrice: parseFloat(form.sellingPrice),
        unit: form.unit,
        unitsPerCarton: form.unitsPerCarton ? parseInt(form.unitsPerCarton) : null,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        lowStockAlert: parseInt(form.lowStockAlert) || 10,
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
        barcode: form.barcode || null,
        sku: form.sku || null,
      };
      if (editingId) {
        await apiFetch(`/api/products/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast.success('Product updated!');
      } else {
        await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Product added!');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      toast.success('Product removed');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const stockBadge = (p: Product) => {
    const st = getStockStatus(p.stockQuantity, p.lowStockAlert);
    if (st === 'out') return <Badge color="red">Out of Stock</Badge>;
    if (st === 'low') return <Badge color="amber">Low Stock</Badge>;
    return <Badge color="green">In Stock</Badge>;
  };

  const expBadge = (p: Product) => {
    if (!p.expiryDate) return null;
    const st = getExpiryStatus(p.expiryDate);
    if (st === 'expired') return <Badge color="red">Expired</Badge>;
    if (st === 'critical') return <Badge color="red">Critical</Badge>;
    if (st === 'warning') return <Badge color="amber">Expiring Soon</Badge>;
    return null;
  };

  const stats = {
    total: products.length,
    low: products.filter((p) => getStockStatus(p.stockQuantity, p.lowStockAlert) === 'low').length,
    out: products.filter((p) => p.stockQuantity === 0).length,
    expiring: products.filter((p) => { const st = getExpiryStatus(p.expiryDate); return st === 'warning' || st === 'critical'; }).length,
  };

  const f = field => (e: any) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <>
      <Topbar title="Products & Stock" onSearch={setSearch} />
      <div className="flex-1 p-4 md:p-6">
        <div className="page-header mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Products & Stock</h2>
            <p className="text-[13px] text-[var(--text-muted)]">Manage all products, categories, and stock levels</p>
          </div>
          <Button onClick={openAdd}><Plus size={14} /> Add Product</Button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <StatCard label="Total Products" value={stats.total} icon={Boxes} color="blue" />
          <StatCard label="Low Stock" value={stats.low} sub="Need reorder" icon={AlertTriangle} color="amber" />
          <StatCard label="Out of Stock" value={stats.out} icon={XCircle} color="red" />
          <StatCard label="Expiring Soon" value={stats.expiring} sub="Within 30 days" icon={CalendarX} color="amber" />
        </div>

        <Card>
          <div className="mb-4 flex flex-wrap gap-2">
            <Input placeholder="Search name, barcode, SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="min-w-[200px] flex-1" />
            <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="ok">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </Select>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Loading products...</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {['Product', 'Category', 'Sell Price', 'Cost', 'Stock', 'Unit', 'Expiry', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="border-b-2 border-[var(--border)] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered().map((p) => (
                    <tr key={p.id} className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]">
                      <td className="px-3 py-2.5 font-medium text-[13px]">{p.name}</td>
                      <td className="px-3 py-2.5"><Badge color="blue">{p.category?.name || '—'}</Badge></td>
                      <td className="px-3 py-2.5 font-bold text-[var(--green)] text-[13px]">{formatCurrency(p.sellingPrice)}</td>
                      <td className="px-3 py-2.5 text-[13px] text-[var(--text-muted)]">{formatCurrency(p.costPrice)}</td>
                      <td className="px-3 py-2.5 font-bold text-[13px]">{p.stockQuantity}</td>
                      <td className="px-3 py-2.5 text-[12px] text-[var(--text-muted)]">{p.unit}</td>
                      <td className="px-3 py-2.5 text-[12px]">{p.expiryDate ? formatDate(p.expiryDate) : '—'} {expBadge(p)}</td>
                      <td className="px-3 py-2.5">{stockBadge(p)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(p)}><Pencil size={12} /></Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(p.id, p.name)}><Trash2 size={12} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered().length === 0 && (
                    <tr><td colSpan={9} className="py-8 text-center text-sm text-[var(--text-muted)]">No products found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Product' : 'Add New Product'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormGroup label="Product Name *">
            <Input value={form.name} onChange={f('name')} placeholder="e.g. Nestle Milo 400g" className="col-span-2" />
          </FormGroup>
          <FormGroup label="Category">
            <Select value={form.categoryId} onChange={f('categoryId')}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Selling Price (₦) *">
            <Input type="number" value={form.sellingPrice} onChange={f('sellingPrice')} placeholder="0.00" />
          </FormGroup>
          <FormGroup label="Cost Price (₦)">
            <Input type="number" value={form.costPrice} onChange={f('costPrice')} placeholder="0.00" />
          </FormGroup>
          <FormGroup label="Stock Quantity">
            <Input type="number" value={form.stockQuantity} onChange={f('stockQuantity')} placeholder="0" />
          </FormGroup>
          <FormGroup label="Unit">
            <Select value={form.unit} onChange={f('unit')}>
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Units Per Carton">
            <Input type="number" value={form.unitsPerCarton} onChange={f('unitsPerCarton')} placeholder="e.g. 24" />
          </FormGroup>
          <FormGroup label="Expiry Date">
            <Input type="date" value={form.expiryDate} onChange={f('expiryDate')} />
          </FormGroup>
          <FormGroup label="Low Stock Alert At">
            <Input type="number" value={form.lowStockAlert} onChange={f('lowStockAlert')} placeholder="10" />
          </FormGroup>
          <FormGroup label="Barcode / SKU">
            <Input value={form.barcode} onChange={f('barcode')} placeholder="Scan or type barcode" />
          </FormGroup>
        </div>
      </Modal>
    </>
  );
}
