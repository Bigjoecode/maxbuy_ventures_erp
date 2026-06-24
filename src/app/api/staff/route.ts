import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const staffSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6),
  phone: z.string().optional().nullable(),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'CASHIER', 'STOCK_KEEPER', 'SALES_REP']),
  branchId: z.string().optional().nullable(),
});

// GET /api/staff — list staff (admin/manager only)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'staff');
  if (auth instanceof NextResponse) return auth;

  const staff = await prisma.staff.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      role: true,
      isActive: true,
      lastActiveAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ staff });
}

// POST /api/staff — create new staff account
export async function POST(req: NextRequest) {
  const auth = requireAuth(req, 'staff');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = staffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const staff = await prisma.staff.create({
      data: { ...rest, passwordHash },
      select: { id: true, name: true, username: true, role: true, phone: true, isActive: true },
    });
    await logActivity(auth.staffId, 'STAFF_CREATED', `Created staff: ${staff.username} (${staff.role})`);
    return NextResponse.json({ staff }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    throw err;
  }
}
