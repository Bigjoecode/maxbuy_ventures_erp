import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional().nullable(),
  costPrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  unitsPerCarton: z.number().int().positive().optional().nullable(),
  stockQuantity: z.number().int().nonnegative().optional(),
  lowStockAlert: z.number().int().nonnegative().optional(),
  expiryDate: z.string().datetime().optional().nullable(),
  barcode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

interface Params {
  params: { id: string };
}

// GET /api/products/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true, supplier: true, stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({ product });
}

// PATCH /api/products/[id] — edit product (also logs stock adjustments)
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'inventory');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const data = parsed.data;
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...data,
      expiryDate: data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : undefined,
    },
  });

  // Log stock adjustment if quantity changed manually
  if (data.stockQuantity !== undefined && data.stockQuantity !== existing.stockQuantity) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        change: data.stockQuantity - existing.stockQuantity,
        reason: 'adjustment',
      },
    });
  }

  await logActivity(auth.staffId, 'PRODUCT_UPDATED', `Updated product: ${product.name}`);

  return NextResponse.json({ product });
}

// DELETE /api/products/[id] — soft delete (recoverable from the Recycle Bin)
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req, 'inventory');
  if (auth instanceof NextResponse) return auth;

  const product = await prisma.product.update({
    where: { id: params.id },
    data: { isActive: false, deletedAt: new Date() },
  });

  await logActivity(auth.staffId, 'PRODUCT_DELETED', `Removed product: ${product.name}`);

  return NextResponse.json({ success: true });
}
