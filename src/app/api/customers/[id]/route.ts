import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(5).optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  type: z.enum(['RETAIL', 'WHOLESALE', 'VIP']).optional(),
  loyaltyPoints: z.number().int().nonnegative().optional(),
});

interface Params {
  params: { id: string };
}

// GET /api/customers/[id] — includes full purchase history
export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      sales: { orderBy: { createdAt: 'desc' }, include: { items: true } },
      debts: true,
    },
  });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ customer });
}

// PATCH /api/customers/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await prisma.customer.update({ where: { id: params.id }, data: parsed.data });
  await logActivity(auth.staffId, 'CUSTOMER_UPDATED', `Updated customer: ${customer.name}`);
  return NextResponse.json({ customer });
}

// DELETE /api/customers/[id] — soft delete (preserves sales/debt history)
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'customers');
  if (auth instanceof NextResponse) return auth;

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });
  await logActivity(auth.staffId, 'CUSTOMER_DELETED', `Removed customer: ${customer.name}`);
  return NextResponse.json({ success: true });
}
