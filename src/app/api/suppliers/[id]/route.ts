import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  contactName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  productsSupplied: z.string().optional().nullable(),
  balanceOwed: z.number().optional(),
});

interface Params {
  params: { id: string };
}

// PATCH /api/suppliers/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'suppliers');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const supplier = await prisma.supplier.update({ where: { id: params.id }, data: parsed.data });
  await logActivity(auth.staffId, 'SUPPLIER_UPDATED', `Updated supplier: ${supplier.name}`);
  return NextResponse.json({ supplier });
}

// DELETE /api/suppliers/[id] — soft delete
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'suppliers');
  if (auth instanceof NextResponse) return auth;

  const supplier = await prisma.supplier.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });
  await logActivity(auth.staffId, 'SUPPLIER_DELETED', `Removed supplier: ${supplier.name}`);
  return NextResponse.json({ success: true });
}
