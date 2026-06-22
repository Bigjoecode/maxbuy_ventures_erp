import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

// GET /api/dashboard — aggregated KPIs for the dashboard home page
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const [todaySales, yesterdaySales, products, debts, sevenDaysAgo] = await Promise.all([
    prisma.sale.findMany({ where: { createdAt: { gte: startOfToday } } }),
    prisma.sale.findMany({ where: { createdAt: { gte: startOfYesterday, lt: startOfToday } } }),
    prisma.product.findMany({ where: { isActive: true } }),
    prisma.debt.findMany({ where: { isSettled: false }, include: { customer: true } }),
    (async () => {
      const from = new Date(startOfToday);
      from.setDate(from.getDate() - 6);
      return prisma.sale.findMany({ where: { createdAt: { gte: from } } });
    })(),
  ]);

  const todayRevenue = todaySales.reduce((s, x) => s + x.totalAmount, 0);
  const yesterdayRevenue = yesterdaySales.reduce((s, x) => s + x.totalAmount, 0);
  const revenueChangePct = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

  const totalStockValue = products.reduce((s, p) => s + p.sellingPrice * p.stockQuantity, 0);
  const outstandingDebts = debts.reduce((s, d) => s + (d.amount - d.amountPaid), 0);
  const debtorsCount = new Set(debts.map((d) => d.customerId)).size;

  // Weekly chart data: group sales by day
  const weeklyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-NG', { weekday: 'short' });
    weeklyMap[key] = 0;
  }
  for (const s of sevenDaysAgo) {
    const key = s.createdAt.toLocaleDateString('en-NG', { weekday: 'short' });
    if (key in weeklyMap) weeklyMap[key] += s.totalAmount;
  }

  // Low stock / out of stock alerts
  const lowStock = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert);
  const outOfStock = products.filter((p) => p.stockQuantity === 0);

  return NextResponse.json({
    stats: {
      todayRevenue,
      todaySalesCount: todaySales.length,
      totalStockValue,
      totalProducts: products.length,
      outstandingDebts,
      debtorsCount,
      revenueChangePct: Math.round(revenueChangePct * 10) / 10,
    },
    weeklySales: weeklyMap,
    alerts: {
      lowStock: lowStock.map((p) => ({ id: p.id, name: p.name, stockQuantity: p.stockQuantity })),
      outOfStock: outOfStock.map((p) => ({ id: p.id, name: p.name })),
    },
  });
}
