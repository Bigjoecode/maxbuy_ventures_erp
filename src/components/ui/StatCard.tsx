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
    <div className="relative overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-3.5 sm:p-[18px]">
      <div className={cn('absolute right-0 top-0 h-14 w-14 rounded-bl-[80px] opacity-[0.06] sm:h-20 sm:w-20', colors.dot)} />
      {/* Icon kept small and out of the value's way */}
      <Icon className={cn('absolute right-3 top-3 h-3.5 w-3.5 sm:right-[18px] sm:top-[18px] sm:h-[18px] sm:w-[18px]', colors.icon)} />
      <div className="mb-1 pr-6 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)] sm:text-[11px]">{label}</div>
      <div className="font-display text-[16px] font-extrabold leading-tight tabular-nums text-[var(--text)] break-words sm:text-[22px] lg:text-[26px]">{value}</div>
      {sub && (
        <div className="mt-1 text-[10px] text-[var(--text-muted)] sm:text-[11px]">
          {subType === 'up' && <span className="font-semibold text-[var(--green)]">↑ </span>}
          {subType === 'down' && <span className="font-semibold text-[var(--red)]">↓ </span>}
          {sub}
        </div>
      )}
    </div>
  );
}
