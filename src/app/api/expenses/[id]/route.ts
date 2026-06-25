import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const updateSchema = z.object({
  category: z.enum(['RENT', 'ELECTRICITY', 'TRANSPORT', 'STAFF_SALARY', 'RESTOCKING', 'REPAIRS', 'OTHER']).optional(),
  description: z.string().optional().nullable(),
  amount: z.number().positive().optional(),
  date: z.string().datetime().optional(),
});

interface Params {
  params: { id: string };
}

// PATCH /api/expenses/[id] — edit an expense
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'expenses');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const expense = await prisma.expense.update({
    where: { id: params.id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
    include: { recordedBy: { select: { name: true } } },
  });

  await logActivity(auth.staffId, 'EXPENSE_UPDATED', `Updated expense ${params.id} — ${expense.category}: ₦${expense.amount.toLocaleString()}`);
  return NextResponse.json({ expense });
}

// DELETE /api/expenses/[id] — soft delete (recoverable from the Recycle Bin).
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'expenses');
  if (auth instanceof NextResponse) return auth;

  const expense = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

  await prisma.expense.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  await logActivity(auth.staffId, 'EXPENSE_DELETED', `Removed expense — ${expense.category}: ₦${expense.amount.toLocaleString()}`);
  return NextResponse.json({ success: true });
}
