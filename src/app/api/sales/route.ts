import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { nextInvoiceNumber } from '@/lib/invoice';
import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const saleSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1),
  discountPct: z.number().min(0).max(100).default(0),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'POS', 'CREDIT']).default('CASH'),
  isCreditSale: z.boolean().default(false), // if true, also creates a Debt record
  dueDate: z.string().datetime().optional().nullable(),
  clientRef: z.string().min(8).max(64).optional(), // idempotency key for offline sync
});

// GET /api/sales — list sales (supports ?period=today|week|month)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'today';

  const now = new Date();
  let from: Date;
  if (period === 'week') {
    from = new Date(now);
    from.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
  }

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: from } },
    include: {
      customer: true,
      staff: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ sales });
}

// POST /api/sales — create a new sale (POS checkout)
// This is the central automation point: deducts stock, updates loyalty points,
// records the invoice, and optionally creates a debt for credit sales.
export async function POST(req: NextRequest) {
  const auth = requireAuth(req, 'pos');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  const { customerId, items, discountPct, paymentMethod, isCreditSale, dueDate, clientRef } = parsed.data;

  // Idempotency: if this offline-queued sale was already processed (e.g. a retry
  // after a flaky network), return the existing sale instead of duplicating it.
  if (clientRef) {
    const existing = await prisma.sale.findUnique({ where: { clientRef }, include: { items: true } });
    if (existing) {
      return NextResponse.json({ sale: existing, deduped: true }, { status: 200 });
    }
  }

  // Reserve the invoice number up-front (atomic, outside the transaction) so the
  // counter's row lock is not held for the whole sale — keeps checkout fast.
  const invoiceNumber = await nextInvoiceNumber(prisma);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch products and validate stock availability
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });

      let subtotal = 0;
      const lineItems: { productId: string; quantity: number; unitPrice: number; lineTotal: number }[] = [];

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
        }
        const lineTotal = product.sellingPrice * item.quantity;
        subtotal += lineTotal;
        lineItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: product.sellingPrice, lineTotal });
      }

      const totalAmount = subtotal * (1 - discountPct / 100);

      // 3. Create the sale + items (invoiceNumber reserved above)
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          clientRef: clientRef || null,
          customerId: customerId || null,
          staffId: auth.staffId,
          subtotal,
          discountPct,
          totalAmount,
          paymentMethod: isCreditSale ? 'CREDIT' : paymentMethod,
          items: { create: lineItems },
        },
        include: { items: true },
      });

      // 4. Deduct stock + record stock movements (automatic stock deduction)
      for (const item of lineItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            change: -item.quantity,
            reason: 'sale',
            reference: sale.id,
          },
        });
      }

      // 5. Update customer stats + loyalty points (₦1,000 spent = 10 points)
      if (customerId) {
        const pointsEarned = Math.floor(totalAmount / 1000) * 10;
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalSpent: { increment: totalAmount },
            loyaltyPoints: { increment: pointsEarned },
          },
        });
      }

      // 6. Create debt record for credit sales
      if (isCreditSale && customerId) {
        await tx.debt.create({
          data: {
            customerId,
            saleId: sale.id,
            amount: totalAmount,
            dueDate: dueDate ? new Date(dueDate) : null,
            description: `Credit sale — ${invoiceNumber}`,
          },
        });
      }

      // 7. Activity log
      await tx.activityLog.create({
        data: { staffId: auth.staffId, action: 'SALE_CREATED', details: `${invoiceNumber} — ₦${totalAmount.toLocaleString()}` },
      });

      return sale;
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ sale: result }, { status: 201 });
  } catch (err: any) {
    // Concurrent retry with the same idempotency key: the unique constraint
    // fired — return the sale that won the race instead of an error.
    if (err?.code === 'P2002' && clientRef) {
      const existing = await prisma.sale.findUnique({ where: { clientRef }, include: { items: true } });
      if (existing) return NextResponse.json({ sale: existing, deduped: true }, { status: 200 });
    }
    return NextResponse.json({ error: err.message || 'Failed to process sale' }, { status: 400 });
  }
}
