import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatColor = 'green' | 'amber' | 'red' | 'blue' | 'purple';

const COLOR_MAP: Record<StatColor, { dot: string; icon: string }> = {
  green: { dot: 'bg-[var(--green)]', icon: 'text-[var(--green)]' },
  amber: { dot: 'bg-[var(--amber)]', icon: 'text-[var(--amber)]' },
  red: { dot: 'bg-[var(--red)]', icon: 'text-[var(--red)]' },
  blue: { dot: 'bg-[var(--blue)]', icon: 'text-[var(--blue)]' },
  purple: { dot: 'bg-[var(--purple)]', icon: 'text-[var(--purple)]' },
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subType?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color: StatColor;
}

export function StatCard({ label, value, sub, subType = 'neutral', icon: Icon, color }: StatCardProps) {
  const colors = COLOR_MAP[color];
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-[18px]">
      <div className={cn('absolute right-0 top-0 h-20 w-20 rounded-bl-[80px] opacity-[0.06]', colors.dot)} />
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
      <div className="font-display text-[26px] font-extrabold leading-none text-[var(--text)]">{value}</div>
      {sub && (
        <div className="mt-1 text-[11px] text-[var(--text-muted)]">
          {subType === 'up' && <span className="font-semibold text-[var(--green)]">↑ </span>}
          {subType === 'down' && <span className="font-semibold text-[var(--red)]">↓ </span>}
          {sub}
        </div>
      )}
      <Icon size={22} className={cn('absolute right-[18px] top-[18px]', colors.icon)} />
    </div>
  );
}
