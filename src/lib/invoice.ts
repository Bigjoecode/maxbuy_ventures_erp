import { PrismaClient } from '@prisma/client';

const INVOICE_COUNTER = 'invoice';

/**
 * Reserves and returns the next unique invoice number (e.g. "INV-0042").
 *
 * Call this with the base client BEFORE the sale transaction. The increment is
 * a single atomic `UPDATE ... SET value = value + 1` statement, so its row lock
 * is held only for that statement (milliseconds) — not for the whole sale
 * transaction. That keeps checkout throughput high while still guaranteeing
 * uniqueness under concurrency. If the surrounding sale later fails, the number
 * is simply skipped (gaps in invoice numbers are acceptable).
 */
export async function nextInvoiceNumber(db: PrismaClient): Promise<string> {
  // One-time lazy initialization (normally the counter is seeded already).
  const existing = await db.counter.findUnique({ where: { name: INVOICE_COUNTER } });
  if (!existing) {
    const last = await db.sale.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });
    const start = last ? parseInt(last.invoiceNumber.replace('INV-', ''), 10) || 0 : 0;
    try {
      await db.counter.create({ data: { name: INVOICE_COUNTER, value: start } });
    } catch {
      /* concurrent first-time create — ignore; the atomic update below still works */
    }
  }

  const counter = await db.counter.update({
    where: { name: INVOICE_COUNTER },
    data: { value: { increment: 1 } },
  });

  return `INV-${String(counter.value).padStart(4, '0')}`;
}
