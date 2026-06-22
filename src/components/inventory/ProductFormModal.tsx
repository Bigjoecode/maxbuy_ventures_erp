'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, Button, FormGroup, Input, Select } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { Product } from '@/types';

interface Category {
  id: string;
  name: string;
}

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  editingProduct?: Product | null;
}

const UNITS = ['Piece', 'Carton', 'Pack', 'Bag', 'Bottle', 'Kg', 'Tin'];

export function ProductFormModal({ open, onClose, onSaved, categories, editingProduct }: ProductFormModalProps) {
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    sellingPrice: '',
    costPrice: '',
    stockQuantity: '',
    unit: 'Piece',
    expiryDate: '',
    lowStockAlert: '10',
    barcode: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        categoryId: editingProduct.categoryId,
        sellingPrice: String(editingProduct.sellingPrice),
        costPrice: String(editingProduct.costPrice),
        stockQuantity: String(editingProduct.stockQuantity),
        unit: editingProduct.unit,
        expiryDate: editingProduct.expiryDate ? editingProduct.expiryDate.split('T')[0] : '',
        lowStockAlert: String(editingProduct.lowStockAlert),
        barcode: editingProduct.barcode || '',
      });
    } else {
      setForm({
        name: '',
        categoryId: categories[0]?.id || '',
        sellingPrice: '',
        costPrice: '',
        stockQuantity: '',
        unit: 'Piece',
        expiryDate: '',
        lowStockAlert: '10',
        barcode: '',
      });
    }
  }, [editingProduct, categories, open]);

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    if (!form.categoryId) {
      toast.error('Please select a category');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      sellingPrice: parseFloat(form.sellingPrice) || 0,
      costPrice: parseFloat(form.costPrice) || 0,
      stockQuantity: parseInt(form.stockQuantity) || 0,
      unit: form.unit,
      lowStockAlert: parseInt(form.lowStockAlert) || 10,
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
      barcode: form.barcode || null,
    };

    try {
      if (editingProduct) {
        await apiFetch(`/api/products/${editingProduct.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast.success('Product updated successfully!');
      } else {
        await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Product added successfully!');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingProduct ? 'Edit Product' : 'Add New Product'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormGroup label="Product Name *">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nestle Milo 400g" />
          </FormGroup>
        </div>
        <FormGroup label="Category">
          <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup label="Selling Price (₦)">
          <Input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} placeholder="0.00" />
        </FormGroup>
        <FormGroup label="Cost Price (₦)">
          <Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0.00" />
        </FormGroup>
        <FormGroup label="Stock Quantity">
          <Input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} placeholder="0" />
        </FormGroup>
        <FormGroup label="Unit">
          <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            {UNITS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup label="Expiry Date">
          <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
        </FormGroup>
        <FormGroup label="Low Stock Alert At">
          <Input type="number" value={form.lowStockAlert} onChange={(e) => setForm({ ...form, lowStockAlert: e.target.value })} placeholder="10" />
        </FormGroup>
        <div className="sm:col-span-2">
          <FormGroup label="Barcode / SKU">
            <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Scan or type barcode" />
          </FormGroup>
        </div>
      </div>
    </Modal>
  );
}
