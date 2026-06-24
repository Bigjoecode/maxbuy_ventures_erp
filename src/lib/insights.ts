import { formatCurrency } from './utils';

// Local, rule-based business "AI" — reads live dashboard + product data and
// answers questions with deterministic heuristics. No external LLM / API key.

export interface InsightProduct {
  name: string;
  stockQuantity: number;
  lowStockAlert: number;
  sellingPrice: number;
  costPrice: number;
  unit?: string;
  category?: { name?: string } | null;
  expiryDate?: string | null;
}

export interface InsightContext {
  products: InsightProduct[];
  dashboard: { stats?: Record<string, number> } | null;
}

const bullet = (arr: string[]) => arr.map((s) => `• ${s}`).join('\n');

export function generateInsight(query: string, ctx: InsightContext): string {
  const q = (query || '').toLowerCase();
  const products = ctx.products || [];
  const stats = ctx.dashboard?.stats;
  const lowStock = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert);
  const outOfStock = products.filter((p) => p.stockQuantity === 0);

  // --- Restock / low stock ---
  if (/(low|restock|reorder|out of stock|run out|weekend|replenish)/.test(q)) {
    if (lowStock.length === 0 && outOfStock.length === 0) {
      return '✅ Good news — nothing is low or out of stock right now. Every product is above its alert level.';
    }
    const lines: string[] = [];
    if (outOfStock.length) {
      lines.push(`🚨 Out of stock (${outOfStock.length}) — restock urgently:`);
      lines.push(bullet(outOfStock.slice(0, 8).map((p) => p.name)));
    }
    if (lowStock.length) {
      lines.push(`⚠️ Low stock (${lowStock.length}) — running low:`);
      lines.push(bullet(lowStock.slice(0, 8).map((p) => `${p.name} — ${p.stockQuantity} ${p.unit || 'units'} left (alert at ${p.lowStockAlert})`)));
    }
    lines.push('\n💡 Restock out-of-stock fast-movers first, then top up low-stock items before the weekend rush.');
    return lines.join('\n');
  }

  // --- Best-selling / categories ---
  if (/(best.?sell|top product|categor|popular|fast.?mov)/.test(q)) {
    const byCat: Record<string, number> = {};
    for (const p of products) {
      const c = p.category?.name || 'Uncategorized';
      byCat[c] = (byCat[c] || 0) + p.sellingPrice * p.stockQuantity;
    }
    const ranked = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!ranked.length) return "I don't have category data yet — add products with categories to see this breakdown.";
    return [
      '📊 Top categories by inventory value (a proxy until more sales accumulate):',
      bullet(ranked.map(([c, v]) => `${c} — ${formatCurrency(v)}`)),
      '\n💡 For true best-sellers by units sold, check Reports once your sales volume builds up.',
    ].join('\n');
  }

  // --- Debt ---
  if (/(debt|owe|owing|credit|collect|receivable)/.test(q)) {
    const debt = stats?.outstandingDebts ?? 0;
    const debtors = stats?.debtorsCount ?? 0;
    return [
      `💰 Customer debt overview:`,
      `• Outstanding: ${formatCurrency(debt)} across ${debtors} customer(s)`,
      '',
      'Ways to reduce debt risk:',
      bullet([
        'Set a credit limit per customer (especially new wholesale buyers)',
        'Send friendly reminders a few days before due dates',
        'Offer a small discount for early or cash payment',
        "Pause new credit for customers already past due",
        'Review the Debts & Credits page weekly',
      ]),
    ].join('\n');
  }

  // --- Profit margins / pricing ---
  if (/(margin|profit|markup|pricing|markdown)/.test(q)) {
    const withMargin = products.filter((p) => p.sellingPrice > 0);
    if (!withMargin.length) return 'Add products with cost and selling prices to analyse margins.';
    const margins = withMargin.map((p) => ({ name: p.name, m: ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100 }));
    const avg = margins.reduce((s, x) => s + x.m, 0) / margins.length;
    const low = margins.filter((x) => x.m < 15).sort((a, b) => a.m - b.m).slice(0, 5);
    const lines = ['📈 Margin analysis:', `• Average gross margin: ${avg.toFixed(1)}%`];
    if (low.length) {
      lines.push('• Thin-margin items (<15%) to review:');
      lines.push(bullet(low.map((x) => `${x.name} — ${x.m.toFixed(1)}%`)));
    }
    lines.push('\n💡 To grow wholesale profit: negotiate bulk supplier discounts, bundle slow movers with fast ones, and use tiered pricing (retail vs wholesale vs VIP).');
    return lines.join('\n');
  }

  // --- Default: business summary + recommendations (also covers "sales performance") ---
  const lines: string[] = ['📋 Business snapshot:'];
  if (stats) {
    const chg = stats.revenueChangePct ?? 0;
    lines.push(`• Today's revenue: ${formatCurrency(stats.todayRevenue ?? 0)} (${chg >= 0 ? '+' : ''}${chg}% vs yesterday)`);
    lines.push(`• Sales today: ${stats.todaySalesCount ?? 0} transaction(s)`);
    lines.push(`• Stock value: ${formatCurrency(stats.totalStockValue ?? 0)} across ${stats.totalProducts ?? 0} products`);
    lines.push(`• Outstanding debts: ${formatCurrency(stats.outstandingDebts ?? 0)} from ${stats.debtorsCount ?? 0} customer(s)`);
  }
  lines.push(`• Stock alerts: ${lowStock.length} low, ${outOfStock.length} out of stock`);

  const recs: string[] = [];
  if (outOfStock.length) recs.push(`Restock ${outOfStock.length} out-of-stock item(s) to avoid lost sales.`);
  if (lowStock.length) recs.push(`Top up ${lowStock.length} low-stock item(s) soon.`);
  if ((stats?.outstandingDebts ?? 0) > 0) recs.push(`Follow up on ${formatCurrency(stats?.outstandingDebts ?? 0)} in customer debt.`);
  if ((stats?.revenueChangePct ?? 0) < 0) recs.push('Revenue dipped vs yesterday — consider a promo on fast-movers.');
  if (!recs.length) recs.push('All key metrics look healthy — keep it up! 🎉');

  lines.push('\n💡 Recommendations:');
  lines.push(bullet(recs));
  return lines.join('\n');
}
