import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

function requireManager(role: string) {
  return role === 'SUPER_ADMIN' || role === 'MANAGER';
}

// GET /api/admin/trash — soft-deleted records across resources (managers/admins).
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!requireManager(auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [products, customers, suppliers, staff] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, sku: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.customer.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, phone: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.supplier.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, phone: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.staff.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, username: true, deletedAt: true },
      orderBy: { deletedAt: 'desc' },
    }),
  ]);

  return NextResponse.json({ products, customers, suppliers, staff });
}
