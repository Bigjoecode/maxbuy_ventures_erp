import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { logActivity } from '@/lib/audit';
import { z } from 'zod';

const transferSchema = z.object({
  sourceProductId: z.string().min(1),
  toBranchId: z.string().min(1),
  quantity: z.number().int().positive(),
  note: z.string().optional().nullable(),
});

// GET /api/stock-transfers — recent transfers
export async function GET(req: NextRequest) {
  const auth = requireAuth(req, 'inventory');
  if (auth instanceof NextResponse) return auth;

  const transfers = await prisma.stockTransfer.findMany({
    include: { fromBranch: { select: { name: true } }, toBranch: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ transfers });
}

// POST /api/stock-transfers — move stock of a product to another branch.
// The destination product is found by name within the target branch, or cloned
// from the source (without the globally-unique sku/barcode) if it doesn't exist.
export async function POST(req: NextRequest) {
  const auth = requireAuth(req, 'inventory');
  if (auth instanceof NextResponse) return auth;

  const parsed = transferSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  const { sourceProductId, toBranchId, quantity, note } = parsed.data;

  try {
    const transfer = await prisma.$transaction(async (tx) => {
      const source = await tx.product.findFirst({ where: { id: sourceProductId, deletedAt: null } });
      if (!source) throw new Error('Source product not found');
      if (!source.branchId) throw new Error('Source product is not assigned to a branch');
      if (source.branchId === toBranchId) throw new Error('Source and destination branch are the same');
      if (source.stockQuantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${source.stockQuantity}`);
      }

      const toBranch = await tx.branch.findUnique({ where: { id: toBranchId } });
      if (!toBranch) throw new Error('Destination branch not found');

      // Find-or-create the destination product (matched by name within branch).
      let dest = await tx.product.findFirst({
        where: { branchId: toBranchId, name: source.name, deletedAt: null },
      });
      if (!dest) {
        dest = await tx.product.create({
          data: {
            name: source.name,
            categoryId: source.categoryId,
            supplierId: source.supplierId,
            costPrice: source.costPrice,
            sellingPrice: source.sellingPrice,
            unit: source.unit,
            unitsPerCarton: source.unitsPerCarton,
            lowStockAlert: source.lowStockAlert,
            branchId: toBranchId,
            stockQuantity: 0,
          },
        });
      }

      await tx.product.update({ where: { id: source.id }, data: { stockQuantity: { decrement: quantity } } });
      await tx.product.update({ where: { id: dest.id }, data: { stockQuantity: { increment: quantity } } });

      const record = await tx.stockTransfer.create({
        data: {
          fromBranchId: source.branchId,
          toBranchId,
          sourceProductId: source.id,
          destProductId: dest.id,
          productName: source.name,
          quantity,
          note: note || null,
          createdById: auth.staffId,
        },
      });

      await tx.stockMovement.create({
        data: { productId: source.id, change: -quantity, reason: 'transfer_out', reference: record.id },
      });
      await tx.stockMovement.create({
        data: { productId: dest.id, change: quantity, reason: 'transfer_in', reference: record.id },
      });

      await logActivity(
        auth.staffId,
        'STOCK_TRANSFER',
        `Transferred ${quantity} × ${source.name} to ${toBranch.name}`,
        tx
      );

      return record;
    });

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Transfer failed' }, { status: 400 });
  }
}
