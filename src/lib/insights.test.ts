import { describe, it, expect } from 'vitest';
import { generateInsight, InsightContext } from './insights';

const ctx: InsightContext = {
  products: [
    { name: 'Milo', stockQuantity: 0, lowStockAlert: 5, sellingPrice: 3200, costPrice: 2400, unit: 'Piece', category: { name: 'Beverages' } },
    { name: 'Sugar', stockQuantity: 3, lowStockAlert: 10, sellingPrice: 1200, costPrice: 1150, unit: 'Piece', category: { name: 'Groceries' } },
    { name: 'Rice', stockQuantity: 50, lowStockAlert: 10, sellingPrice: 5000, costPrice: 3000, unit: 'Bag', category: { name: 'Groceries' } },
  ],
  dashboard: { stats: { todayRevenue: 0, todaySalesCount: 0, totalStockValue: 100000, totalProducts: 3, outstandingDebts: 75500, debtorsCount: 3, revenueChangePct: -100 } },
};

describe('generateInsight', () => {
  it('lists out-of-stock and low-stock items for a restock query', () => {
    const r = generateInsight('what should I restock?', ctx);
    expect(r).toMatch(/Out of stock/i);
    expect(r).toContain('Milo'); // out of stock
    expect(r).toContain('Sugar'); // low stock
  });

  it('surfaces outstanding debt with the amount', () => {
    const r = generateInsight('how do I reduce customer debt?', ctx);
    expect(r).toMatch(/debt/i);
    expect(r).toContain('75,500');
  });

  it('flags thin-margin items for a margin query', () => {
    const r = generateInsight('analyze my profit margins', ctx);
    expect(r).toMatch(/margin/i);
    expect(r).toContain('Sugar'); // ~4% margin < 15%
  });

  it('falls back to a business snapshot for anything else', () => {
    const r = generateInsight('hello', ctx);
    expect(r).toMatch(/snapshot/i);
    expect(r).toMatch(/Recommendations/i);
  });
});
