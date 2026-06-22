'use client';

import { Bell, Menu, Moon, Plus, Search, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/authStore';

interface TopbarProps {
  title: string;
  onSearch?: (query: string) => void;
  onAlertsClick?: () => void;
}

export function Topbar({ title, onSearch, onAlertsClick }: TopbarProps) {
  const router = useRouter();
  const { darkMode, toggleDarkMode, toggleSidebar } = useUIStore();

  return (
    <div className="sticky top-0 z-50 flex h-[60px] items-center gap-4 border-b border-[var(--border)] bg-[var(--card)] px-4 md:px-6">
      <button
        onClick={toggleSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--green-light)] hover:text-[var(--green)] md:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={16} />
      </button>

      <div className="flex-1 font-display text-base font-bold text-[var(--text)]">{title}</div>

      <div className="hidden w-60 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 sm:flex">
        <Search size={13} className="text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search products, customers..."
          className="w-full bg-transparent text-[13px] text-[var(--text)] outline-none"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/pos')}
          title="New Sale"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--green-light)] hover:text-[var(--green)]"
        >
          <Plus size={15} />
        </button>
        <button
          onClick={onAlertsClick}
          title="Alerts"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--green-light)] hover:text-[var(--green)]"
        >
          <Bell size={15} />
          <span className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full border-2 border-[var(--card)] bg-[var(--red)]" />
        </button>
        <button
          onClick={toggleDarkMode}
          title="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--green-light)] hover:text-[var(--green)]"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </div>
  );
}
