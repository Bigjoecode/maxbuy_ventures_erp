import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-5', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ icon: Icon, children }: { icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-[var(--text)]">
      {Icon && <Icon size={16} className="text-[var(--green)]" />}
      {children}
    </div>
  );
}
