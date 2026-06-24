import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { branchScope } from '@/lib/branch';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  supplierId: z.string().optional().nullable(),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  unit: z.string().default('Piece'),
  unitsPerCarton: z.number().int().positive().optional().nullable(),
  stockQuantity: z.number().int().nonnegative().default(0),
  lowStockAlert: z.number().int().nonnegative().default(10),
  expiryDate: z.string().datetime().optional().nullable(),
  barcode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
});

// GET /api/products — list all products with optional filters
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || undefined;
  const status = searchParams.get('status'); // 'low' | 'out' | 'ok'
  const deleted = searchParams.get('deleted') === '1';

  const products = await prisma.product.findMany({
    where: {
      ...branchScope(auth),
      isActive: deleted ? undefined : true,
      deletedAt: deleted ? { not: null } : null,
      categoryId,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    },
    include: { category: true, supplier: true },
    orderBy: { name: 'asc' },
  });

  let filtered = products;
  if (status === 'low') filtered = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert);
  if (status === 'out') filtered = products.filter((p) => p.stockQuantity === 0);
  if (status === 'ok') filtered = products.filter((p) => p.stockQuantity > p.lowStockAlert);

  return NextResponse.json({ products: filtered });
}

// POST /api/products — create a new product
export async function POST(req: NextRequest) {
  const auth = requireAuth(req, 'inventory');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const product = await prisma.product.create({
    data: {
      ...data,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      supplierId: data.supplierId || null,
      // New products belong to the creator's branch (so they're transferable).
      branchId: data.branchId ?? auth.branchId ?? null,
    },
  });

  if (product.stockQuantity > 0) {
    await prisma.stockMovement.create({
      data: { productId: product.id, change: product.stockQuantity, reason: 'initial_stock' },
    });
  }

  await logActivity(auth.staffId, 'PRODUCT_CREATED', `Added product: ${product.name}`);

  return NextResponse.json({ product }, { status: 201 });
}
