import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const schema = z.object({
  resource: z.enum(['product', 'customer', 'supplier', 'staff']),
  id: z.string().min(1),
});

function requireManager(role: string) {
  return role === 'SUPER_ADMIN' || role === 'MANAGER';
}

// POST /api/admin/restore — recover a soft-deleted record.
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!requireManager(auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'resource and id are required' }, { status: 400 });
  }
  const { resource, id } = parsed.data;

  try {
    if (resource === 'product') {
      await prisma.product.update({ where: { id }, data: { deletedAt: null, isActive: true } });
    } else if (resource === 'customer') {
      await prisma.customer.update({ where: { id }, data: { deletedAt: null } });
    } else if (resource === 'staff') {
      await prisma.staff.update({ where: { id }, data: { deletedAt: null, isActive: true } });
    } else {
      await prisma.supplier.update({ where: { id }, data: { deletedAt: null } });
    }
  } catch {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  await logActivity(auth.staffId, 'RECORD_RESTORED', `Restored ${resource} ${id}`);
  return NextResponse.json({ ok: true });
}
