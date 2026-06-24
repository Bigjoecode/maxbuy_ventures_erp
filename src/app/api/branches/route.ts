import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const branchSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isMain: z.boolean().optional(),
});

function requireManager(role: string) {
  return role === 'SUPER_ADMIN' || role === 'MANAGER';
}

// GET /api/branches
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const branches = await prisma.branch.findMany({
    include: { _count: { select: { staff: true, products: true, sales: true } } },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
  });
  return NextResponse.json({ branches });
}

// POST /api/branches
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!requireManager(auth.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = branchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  // Only one branch can be the main branch.
  const branch = await prisma.$transaction(async (tx) => {
    if (parsed.data.isMain) {
      await tx.branch.updateMany({ where: { isMain: true }, data: { isMain: false } });
    }
    return tx.branch.create({ data: parsed.data });
  });

  await logActivity(auth.staffId, 'BRANCH_CREATED', `Created branch: ${branch.name}`);
  return NextResponse.json({ branch }, { status: 201 });
}
