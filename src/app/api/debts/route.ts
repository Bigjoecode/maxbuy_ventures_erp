import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { z } from 'zod';

const debtSchema = z.object({
  customerId: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().datetime().optional().nullable(),
  description: z.string().optional().nullable(),
});

// GET /api/debts — list outstanding debts, sorted by most overdue first
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const debts = await prisma.debt.findMany({
    where: { isSettled: false },
    include: { customer: true },
    orderBy: { dueDate: 'asc' },
  });

  return NextResponse.json({ debts });
}

// POST /api/debts — record a new debt
export async function POST(req: NextRequest) {
  const auth = requireAuth(req, 'debts');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = debtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const debt = await prisma.debt.create({
    data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : null },
    include: { customer: true },
  });

  return NextResponse.json({ debt }, { status: 201 });
}
