import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isMain: z.boolean().optional(),
});

interface Params {
  params: { id: string };
}

function requireManager(role: string) {
  return role === 'SUPER_ADMIN' || role === 'MANAGER';
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!requireManager(auth.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const branch = await prisma.$transaction(async (tx) => {
    if (parsed.data.isMain) {
      await tx.branch.updateMany({ where: { isMain: true, NOT: { id: params.id } }, data: { isMain: false } });
    }
    return tx.branch.update({ where: { id: params.id }, data: parsed.data });
  });

  await logActivity(auth.staffId, 'BRANCH_UPDATED', `Updated branch: ${branch.name}`);
  return NextResponse.json({ branch });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!requireManager(auth.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const branch = await prisma.branch.findUnique({
    where: { id: params.id },
    include: { _count: { select: { products: true, sales: true, staff: true } } },
  });
  if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
  if (branch.isMain) return NextResponse.json({ error: 'Cannot delete the main branch' }, { status: 400 });
  if (branch._count.products + branch._count.sales + branch._count.staff > 0) {
    return NextResponse.json(
      { error: 'Branch still has products, sales or staff. Reassign them first.' },
      { status: 400 }
    );
  }

  await prisma.branch.delete({ where: { id: params.id } });
  await logActivity(auth.staffId, 'BRANCH_DELETED', `Deleted branch: ${branch.name}`);
  return NextResponse.json({ success: true });
}
