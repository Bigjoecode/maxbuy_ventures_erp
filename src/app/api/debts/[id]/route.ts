import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const paymentSchema = z.object({
  amountPaid: z.number().positive(),
});

interface Params {
  params: { id: string };
}

// PATCH /api/debts/[id] — record a payment (full or partial)
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'debts');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const debt = await prisma.debt.findUnique({ where: { id: params.id } });
  if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 });

  const newAmountPaid = debt.amountPaid + parsed.data.amountPaid;
  const isSettled = newAmountPaid >= debt.amount;

  const updated = await prisma.debt.update({
    where: { id: params.id },
    data: { amountPaid: newAmountPaid, isSettled },
  });

  await logActivity(
    auth.staffId,
    'DEBT_PAYMENT',
    `Recorded ₦${parsed.data.amountPaid.toLocaleString()} payment${isSettled ? ' (settled)' : ''} on debt ${params.id}`
  );

  return NextResponse.json({ debt: updated });
}

// DELETE /api/debts/[id] — soft delete (recoverable from the Recycle Bin).
// To settle a debt instead, use PATCH with the remaining balance.
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'debts');
  if (auth instanceof NextResponse) return auth;

  const debt = await prisma.debt.findUnique({ where: { id: params.id }, include: { customer: true } });
  if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 });

  await prisma.debt.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  await logActivity(auth.staffId, 'DEBT_DELETED', `Removed debt of ₦${debt.amount.toLocaleString()} for ${debt.customer?.name || 'customer'}`);
  return NextResponse.json({ success: true });
}
