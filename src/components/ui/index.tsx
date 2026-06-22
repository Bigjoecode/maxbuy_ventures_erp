import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';

// ===== Button =====
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'amber';
  size?: 'sm' | 'md';
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'bg-[var(--green)] text-white hover:bg-[var(--green-dark)]',
  secondary: 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)]',
  danger: 'bg-[var(--red-light)] text-[var(--red)] border border-[var(--red)] hover:bg-[var(--red)] hover:text-white',
  amber: 'bg-[var(--amber-light)] text-amber-800 border border-[var(--amber)]',
};

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all',
        size === 'md' ? 'px-4 py-2 text-[13px]' : 'px-2.5 py-1 text-xs',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ===== Badge =====
type BadgeColor = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray';

const BADGE_CLASSES: Record<BadgeColor, string> = {
  green: 'bg-[var(--green-light)] text-[var(--green-dark)]',
  red: 'bg-[var(--red-light)] text-red-800',
  amber: 'bg-[var(--amber-light)] text-amber-800',
  blue: 'bg-[var(--blue-light)] text-blue-700',
  purple: 'bg-[var(--purple-light)] text-purple-800',
  gray: 'bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--border)]',
};

export function Badge({ color = 'gray', children }: { color?: BadgeColor; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', BADGE_CLASSES[color])}>
      {children}
    </span>
  );
}

// ===== Modal =====
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-[90%] max-w-lg overflow-y-auto rounded-[14px] bg-[var(--card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <h3 className="font-display text-base font-bold text-[var(--text)]">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)]"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 pb-5">{footer}</div>}
      </div>
    </div>
  );
}

// ===== Form field primitives =====
export function FormGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[var(--text-muted)]">{label}</label>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--green)] focus:bg-[var(--card)]',
        props.className
      )}
    />
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--green)] focus:bg-[var(--card)]',
        props.className
      )}
    >
      {children}
    </select>
  );
}
