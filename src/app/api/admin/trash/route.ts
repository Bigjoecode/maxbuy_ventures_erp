import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

function requireManager(role: string) {
  return role === 'SUPER_ADMIN' || role === 'MANAGER';
}

// GET /api/admin/trash — soft-deleted records across resources (managers/admins).
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!requireManager(auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [products, customers, suppliers, staff, debtRows, expenseRows] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, sku: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.customer.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, phone: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.supplier.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, phone: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.staff.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, username: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.debt.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, amount: true, deletedAt: true, customer: { select: { name: true } } },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.expense.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, category: true, amount: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
  ]);

  // Normalise debts/expenses into the same shape the UI uses elsewhere.
  const debts = debtRows.map((d) => ({
    id: d.id,
    name: d.customer?.name || 'Customer',
    detail: `₦${d.amount.toLocaleString()}`,
    deletedAt: d.deletedAt,
  }));
  const expenses = expenseRows.map((e) => ({
    id: e.id,
    name: e.category.replace(/_/g, ' '),
    detail: `₦${e.amount.toLocaleString()}`,
    deletedAt: e.deletedAt,
  }));

  return NextResponse.json({ products, customers, suppliers, staff, debts, expenses });
}

// DELETE /api/admin/trash — permanently remove items from the recycle bin.
// SUPER_ADMIN only. Body: { resource, id } to delete one, or { all: true } to
// empty the entire bin.
const deleteSchema = z.union([
  z.object({ resource: z.enum(['product', 'customer', 'supplier', 'staff', 'debt', 'expense']), id: z.string().min(1) }),
  z.object({ all: z.literal(true) }),
]);

async function hardDeleteOne(resource: string, id: string) {
  switch (resource) {
    case 'product': return prisma.product.delete({ where: { id } });
    case 'customer': return prisma.customer.delete({ where: { id } });
    case 'supplier': return prisma.supplier.delete({ where: { id } });
    case 'staff': return prisma.staff.delete({ where: { id } });
    case 'debt': return prisma.debt.delete({ where: { id } });
    case 'expense': return prisma.expense.delete({ where: { id } });
    default: throw new Error('Unknown resource');
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only a super admin can permanently delete records' }, { status: 403 });
  }

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Provide { resource, id } or { all: true }' }, { status: 400 });
  }

  // Empty the whole bin: best-effort across every resource. Records with linked
  // history (e.g. a product that has sales) can't be hard-deleted and are kept.
  if ('all' in parsed.data) {
    const [products, customers, suppliers, staff, debts, expenses] = await Promise.all([
      prisma.product.findMany({ where: { deletedAt: { not: null } }, select: { id: true } }),
      prisma.customer.findMany({ where: { deletedAt: { not: null } }, select: { id: true } }),
      prisma.supplier.findMany({ where: { deletedAt: { not: null } }, select: { id: true } }),
      prisma.staff.findMany({ where: { deletedAt: { not: null } }, select: { id: true } }),
      prisma.debt.findMany({ where: { deletedAt: { not: null } }, select: { id: true } }),
      prisma.expense.findMany({ where: { deletedAt: { not: null } }, select: { id: true } }),
    ]);

    const all: [string, string][] = [
      ...products.map((r) => ['product', r.id] as [string, string]),
      ...customers.map((r) => ['customer', r.id] as [string, string]),
      ...suppliers.map((r) => ['supplier', r.id] as [string, string]),
      ...staff.map((r) => ['staff', r.id] as [string, string]),
      ...debts.map((r) => ['debt', r.id] as [string, string]),
      ...expenses.map((r) => ['expense', r.id] as [string, string]),
    ];

    let removed = 0;
    let skipped = 0;
    for (const [resource, id] of all) {
      try {
        await hardDeleteOne(resource, id);
        removed++;
      } catch {
        skipped++; // linked records prevent hard delete — leave in the bin
      }
    }

    await logActivity(auth.staffId, 'TRASH_EMPTIED', `Permanently removed ${removed} record(s)${skipped ? `, ${skipped} kept (linked history)` : ''}`);
    return NextResponse.json({ ok: true, removed, skipped });
  }

  // Single permanent delete.
  const { resource, id } = parsed.data;
  try {
    await hardDeleteOne(resource, id);
  } catch (err: any) {
    if (err?.code === 'P2003' || err?.code === 'P2014') {
      return NextResponse.json(
        { error: 'This record has linked history (sales, payments, etc.) and cannot be permanently deleted. It stays in the recycle bin.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  await logActivity(auth.staffId, 'RECORD_PURGED', `Permanently deleted ${resource} ${id}`);
  return NextResponse.json({ ok: true });
}
