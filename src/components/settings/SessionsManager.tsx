'use client';

import { useEffect, useState } from 'react';
import { MonitorSmartphone, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/apiClient';

interface SessionRow {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: string;
  createdAt: string;
  current: boolean;
}

function describeDevice(ua: string | null): string {
  if (!ua) return 'Unknown device';
  const browser =
    /edg/i.test(ua) ? 'Edge'
    : /chrome/i.test(ua) ? 'Chrome'
    : /firefox/i.test(ua) ? 'Firefox'
    : /safari/i.test(ua) ? 'Safari'
    : 'Browser';
  const os =
    /windows/i.test(ua) ? 'Windows'
    : /android/i.test(ua) ? 'Android'
    : /iphone|ipad|ios/i.test(ua) ? 'iOS'
    : /mac/i.test(ua) ? 'macOS'
    : /linux/i.test(ua) ? 'Linux'
    : '';
  return os ? `${browser} on ${os}` : browser;
}

export function SessionsManager() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await apiFetch<{ sessions: SessionRow[] }>('/api/auth/sessions');
      setSessions(data.sessions);
    } catch {
      /* apiFetch handles auth redirects */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function revokeOne(id: string) {
    try {
      await apiFetch(`/api/auth/sessions?id=${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Device signed out');
    } catch {
      toast.error('Could not sign out that device');
    }
  }

  async function revokeOthers() {
    try {
      await apiFetch('/api/auth/sessions?others=1', { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.current));
      toast.success('Signed out all other devices');
    } catch {
      toast.error('Could not sign out other devices');
    }
  }

  const hasOthers = sessions.some((s) => !s.current);

  return (
    <Card>
      <CardTitle icon={MonitorSmartphone}>Active Sessions</CardTitle>

      {loading ? (
        <p className="text-[13px] text-[var(--text-muted)]">Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">No active sessions found.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--text)]">
                  {describeDevice(s.userAgent)}
                  {s.current && (
                    <span className="ml-2 rounded-full bg-[var(--green-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--green-dark)]">
                      This device
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {s.ipAddress || 'unknown IP'} · last active {new Date(s.lastUsedAt).toLocaleString()}
                </p>
              </div>
              {!s.current && (
                <button
                  onClick={() => revokeOne(s.id)}
                  className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-muted)] hover:border-[var(--red)] hover:text-[var(--red)]"
                >
                  <LogOut size={13} /> Sign out
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={revokeOthers}
        disabled={!hasOthers}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--red)] bg-[var(--red-light)] px-3 py-2.5 text-[13px] font-medium text-[var(--red)] transition-colors hover:bg-[var(--red)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        ⚠️ Sign Out All Other Devices
      </button>
    </Card>
  );
}
