import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

// GET /api/reports?type=sales|inventory|financial|customer&period=month|quarter|year
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month';

  const now = new Date();
  let from: Date;
  if (period === 'year') {
    from = new Date(now.getFullYear(), 0, 1);
  } else if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    from = new Date(now.getFullYear(), q * 3, 1);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [sales, expenses, products, customers] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: from }, isRefunded: false },
      include: { items: { include: { product: { include: { category: true } } } } },
    }),
    prisma.expense.findMany({ where: { date: { gte: from } } }),
    prisma.product.findMany({ where: { isActive: true }, include: { category: true } }),
    prisma.customer.findMany({ include: { sales: { where: { createdAt: { gte: from } } } } }),
  ]);

  // Revenue / profit totals
  const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const totalCostOfGoods = sales.reduce((s, sale) =>
    s + sale.items.reduce((is, item) => is + ((item.product as any)?.costPrice || 0) * item.quantity, 0), 0
  );
  const grossProfit = totalRevenue - totalCostOfGoods;
  const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // Product sales rankings
  const productSalesMap: Record<string, { name: string; category: string; unitsSold: number; revenue: number; profit: number }> = {};
  for (const sale of sales) {
    for (const item of sale.items) {
      const p = item.product as any;
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: p?.name || 'Unknown', category: p?.category?.name || '', unitsSold: 0, revenue: 0, profit: 0 };
      }
      productSalesMap[item.productId].unitsSold += item.quantity;
      productSalesMap[item.productId].revenue += item.lineTotal;
      productSalesMap[item.productId].profit += (item.unitPrice - (p?.costPrice || 0)) * item.quantity;
    }
  }
  const bestSellers = Object.entries(productSalesMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Inventory valuation by category
  const categoryValuation: Record<string, { category: string; stockValue: number; productCount: number }> = {};
  for (const p of products) {
    const cat = p.category?.name || 'Uncategorised';
    if (!categoryValuation[cat]) categoryValuation[cat] = { category: cat, stockValue: 0, productCount: 0 };
    categoryValuation[cat].stockValue += p.sellingPrice * p.stockQuantity;
    categoryValuation[cat].productCount++;
  }

  // Monthly revenue breakdown (last 12 months)
  const monthlyRevenue: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
    monthlyRevenue[key] = 0;
  }
  for (const s of sales) {
    const key = s.createdAt.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
    if (key in monthlyRevenue) monthlyRevenue[key] += s.totalAmount;
  }

  // Customer analysis
  const customerAnalysis = customers
    .map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      totalSpent: c.totalSpent,
      orderCount: c.sales.length,
      avgOrder: c.sales.length > 0 ? c.totalSpent / c.sales.length : 0,
      loyaltyPoints: c.loyaltyPoints,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  return NextResponse.json({
    period,
    financial: {
      totalRevenue,
      totalCostOfGoods,
      grossProfit,
      grossMarginPct: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0,
      totalExpenses,
      netProfit,
      transactionCount: sales.length,
    },
    bestSellers,
    categoryValuation: Object.values(categoryValuation).sort((a, b) => b.stockValue - a.stockValue),
    monthlyRevenue,
    customerAnalysis,
  });
}
