'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { apiFetch } from '@/lib/apiClient';

interface LogEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  staff: { name: string; username: string } | null;
}

const ACTION_COLOR: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700',
  SALE_CREATED: 'bg-green-100 text-green-700',
  PRODUCT_DELETED: 'bg-red-100 text-red-700',
  CUSTOMER_DELETED: 'bg-red-100 text-red-700',
  SUPPLIER_DELETED: 'bg-red-100 text-red-700',
  RECORD_RESTORED: 'bg-emerald-100 text-emerald-700',
  PASSWORD_RESET: 'bg-amber-100 text-amber-700',
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 50;

  async function load(p: number) {
    setLoading(true);
    try {
      const res = await apiFetch<{ logs: LogEntry[]; total: number }>(`/api/admin/activity?page=${p}`);
      setLogs(res.logs);
      setTotal(res.total);
      setPage(p);
    } catch (err: any) {
      toast.error(err.message || 'Could not load activity log');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <Topbar title="Activity Log" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Activity & Audit Log</h2>
          <p className="text-[13px] text-[var(--text-muted)]">A record of who did what, across the system.</p>
        </div>

        <Card>
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[var(--text-muted)]">No activity recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                  <ScrollText size={15} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACTION_COLOR[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {log.action}
                      </span>
                      <span className="text-[12px] font-medium text-[var(--text)]">{log.staff?.name || 'System'}</span>
                    </div>
                    {log.details && <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">{log.details}</p>}
                  </div>
                  <span className="shrink-0 text-[11px] text-[var(--text-muted)]">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-muted)]">
              Page {page + 1} of {totalPages} · {total} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => load(page - 1)}
                disabled={page === 0 || loading}
                className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--text)] disabled:opacity-40"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button
                onClick={() => load(page + 1)}
                disabled={page + 1 >= totalPages || loading}
                className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--text)] disabled:opacity-40"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
