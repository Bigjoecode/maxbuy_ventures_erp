import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  type: z.enum(['RETAIL', 'WHOLESALE', 'VIP']).default('RETAIL'),
});

// GET /api/customers?search=
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const deleted = searchParams.get('deleted') === '1';

  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: deleted ? { not: null } : null,
      ...(search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] }
        : {}),
    },
    include: { debts: { where: { isSettled: false } } },
    orderBy: { totalSpent: 'desc' },
  });

  return NextResponse.json({ customers });
}

// POST /api/customers
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await prisma.customer.create({ data: parsed.data });
  await logActivity(auth.staffId, 'CUSTOMER_CREATED', `Added customer: ${customer.name}`);
  return NextResponse.json({ customer }, { status: 201 });
}
