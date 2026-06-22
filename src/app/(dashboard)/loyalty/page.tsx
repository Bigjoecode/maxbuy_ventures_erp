'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Star, Coins, Gift, Flame, Trophy, Crown } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { apiFetch } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/utils';
import { Customer } from '@/types';

function getTier(points: number): { label: string; color: 'green' | 'amber' | 'purple'; icon: string } {
  if (points >= 1000) return { label: 'Gold', color: 'amber', icon: '🏆' };
  if (points >= 500) return { label: 'Silver', color: 'purple', icon: '🥈' };
  return { label: 'Bronze', color: 'green', icon: '🥉' };
}

export default function LoyaltyPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ customers: Customer[] }>('/api/customers')
      .then((r) => setCustomers(r.customers.filter((c) => c.loyaltyPoints > 0).sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalPoints = customers.reduce((s, c) => s + c.loyaltyPoints, 0);
  const goldMembers = customers.filter((c) => c.loyaltyPoints >= 1000).length;
  const silverMembers = customers.filter((c) => c.loyaltyPoints >= 500 && c.loyaltyPoints < 1000).length;
  const activeMembers = customers.length;

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  return (
    <>
      <Topbar title="Loyalty Program" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Loyalty Program</h2>
          <p className="text-[13px] text-[var(--text-muted)]">Reward your best customers and drive repeat purchases</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <StatCard label="Total Members" value={activeMembers} icon={Star} color="green" />
          <StatCard label="Points Issued" value={totalPoints.toLocaleString()} icon={Coins} color="amber" />
          <StatCard label="Gold Members" value={goldMembers} sub="1000+ points" icon={Crown} color="purple" />
          <StatCard label="Silver Members" value={silverMembers} sub="500–999 pts" icon={Trophy} color="blue" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Leaderboard */}
          <Card>
            <CardTitle icon={Trophy}>Top Customers Leaderboard</CardTitle>
            {loading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
            {customers.slice(0, 10).map((c, i) => {
              const tier = getTier(c.loyaltyPoints);
              const pct = Math.min((c.loyaltyPoints / (customers[0]?.loyaltyPoints || 1)) * 100, 100);
              return (
                <div key={c.id} className="mb-3 flex items-center gap-3 rounded-lg bg-[var(--bg)] p-2.5">
                  <span className="w-6 text-center text-lg">{medals[i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[13px] font-semibold">{c.name}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-[var(--border)]">
                      <div className="h-full rounded-full bg-[var(--amber)] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge color={tier.color}>{tier.icon} {c.loyaltyPoints.toLocaleString()} pts</Badge>
                    <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{tier.label} tier</p>
                  </div>
                </div>
              );
            })}
            {!loading && customers.length === 0 && (
              <p className="text-center text-sm text-[var(--text-muted)]">No loyalty members yet — points are earned automatically at checkout.</p>
            )}
          </Card>

          {/* Rules */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardTitle icon={Star}>How Points Work</CardTitle>
              <div className="flex flex-col gap-2.5">
                <RuleRow color="green" icon="💰" title="Earn points" desc="₦1,000 spent = 10 points — auto-applied at every POS sale" />
                <RuleRow color="amber" icon="🎁" title="Redeem rewards" desc="100 points = ₦500 discount — cashier applies at checkout" />
                <RuleRow color="purple" icon="👑" title="Gold tier bonus" desc="1,000+ points unlocks permanent 5% extra discount on all purchases" />
                <RuleRow color="blue" icon="🥈" title="Silver tier" desc="500–999 points — priority customer service and 2% bonus discount" />
              </div>
            </Card>

            <Card>
              <CardTitle icon={Flame}>Program Stats</CardTitle>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Avg Points / Customer" value={activeMembers > 0 ? Math.round(totalPoints / activeMembers).toLocaleString() : '0'} />
                <StatBox label="Redeemable Value" value={formatCurrency((totalPoints / 100) * 500)} />
                <StatBox label="Gold Members" value={`${goldMembers} (${Math.round((goldMembers / Math.max(activeMembers, 1)) * 100)}%)`} />
                <StatBox label="Total Members" value={activeMembers.toString()} />
              </div>
            </Card>
          </div>
        </div>

        {/* Full table */}
        <Card className="mt-4">
          <CardTitle>All Loyalty Members</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Rank', 'Customer', 'Type', 'Points', 'Tier', 'Total Spent', 'Redeemable'].map((h) => (
                    <th key={h} className="border-b-2 border-[var(--border)] pb-2 pr-4 pt-1 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => {
                  const tier = getTier(c.loyaltyPoints);
                  return (
                    <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--bg)]">
                      <td className="py-3 pr-4 text-sm font-bold text-[var(--text-muted)]">{medals[i] || `#${i + 1}`}</td>
                      <td className="py-3 pr-4 text-[13px] font-semibold">{c.name}</td>
                      <td className="py-3 pr-4"><Badge color="blue">{c.type}</Badge></td>
                      <td className="py-3 pr-4 font-bold text-[var(--amber)]">{c.loyaltyPoints.toLocaleString()}</td>
                      <td className="py-3 pr-4"><Badge color={tier.color}>{tier.icon} {tier.label}</Badge></td>
                      <td className="py-3 pr-4 font-semibold text-[var(--green)]">{formatCurrency(c.totalSpent)}</td>
                      <td className="py-3 pr-4 text-[13px] text-[var(--blue)]">{formatCurrency((c.loyaltyPoints / 100) * 500)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function RuleRow({ color, icon, title, desc }: { color: string; icon: string; title: string; desc: string }) {
  const bg: Record<string, string> = {
    green: 'bg-[var(--green-light)] border-emerald-200',
    amber: 'bg-[var(--amber-light)] border-amber-200',
    purple: 'bg-[var(--purple-light)] border-purple-200',
    blue: 'bg-[var(--blue-light)] border-blue-200',
  };
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${bg[color] || bg.green}`}>
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-[13px] font-semibold text-[var(--text)]">{title}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{desc}</p>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg)] p-3">
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="font-display text-[18px] font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}
