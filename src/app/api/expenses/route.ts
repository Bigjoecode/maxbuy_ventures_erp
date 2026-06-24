import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { branchScope } from '@/lib/branch';
import { z } from 'zod';

const expenseSchema = z.object({
  category: z.enum(['RENT', 'ELECTRICITY', 'TRANSPORT', 'STAFF_SALARY', 'RESTOCKING', 'REPAIRS', 'OTHER']),
  description: z.string().optional().nullable(),
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
});

// GET /api/expenses?period=today|week|month
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period');

  let from: Date | undefined;
  const now = new Date();
  if (period === 'today') {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    from = new Date(now);
    from.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const expenses = await prisma.expense.findMany({
    where: { ...branchScope(auth), ...(from ? { date: { gte: from } } : {}) },
    include: { recordedBy: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ expenses });
}

// POST /api/expenses
export async function POST(req: NextRequest) {
  const auth = requireAuth(req, 'expenses');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const expense = await prisma.expense.create({
    data: {
      category: data.category,
      description: data.description,
      amount: data.amount,
      date: data.date ? new Date(data.date) : new Date(),
      recordedById: auth.staffId,
    },
    include: { recordedBy: { select: { name: true } } },
  });

  await logActivity(auth.staffId, 'EXPENSE_RECORDED', `${data.category}: ₦${data.amount.toLocaleString()}`);

  return NextResponse.json({ expense }, { status: 201 });
}
