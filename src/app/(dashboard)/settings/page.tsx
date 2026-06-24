'use client';

import { Moon, ShieldCheck, Sun, Database, Building2, Users } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { useUIStore } from '@/store/authStore';
import { SessionsManager } from '@/components/settings/SessionsManager';

const READINESS_ITEMS = [
  { label: 'Authentication', detail: 'httpOnly cookie sessions with refresh rotation', status: 'Active' },
  { label: 'Role permissions', detail: 'Dashboard access is enforced by RBAC', status: 'Active' },
  { label: 'Offline POS', detail: 'Queued sales sync automatically when internet returns', status: 'Active' },
  { label: 'Receipts', detail: 'Browser print and WhatsApp sharing are available', status: 'Active' },
];

const BACKUP_ITEMS = [
  'Nightly PostgreSQL backups should be scheduled on the production host.',
  'Encrypted GPG + optional S3 backup flow is documented in docs/BACKUP.md.',
  'Run a restore drill before launch and record the recovery time.',
];

export default function SettingsPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <>
      <Topbar title="Settings" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Settings</h2>
          <p className="text-[13px] text-[var(--text-muted)]">Launch-critical admin controls and operational status for Maxbuy Ventures.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle icon={Moon}>Appearance</CardTitle>
            <div className="space-y-4">
              <ToggleSetting
                label="Dark Mode"
                sub="Stored on this device for the current admin user experience."
                checked={darkMode}
                onChange={toggleDarkMode}
                icon={darkMode ? <Sun size={15} /> : <Moon size={15} />}
              />
              <div className="rounded-lg bg-[var(--bg)] p-3 text-[12px] text-[var(--text-muted)]">
                Theme preference is the only user-facing setting currently persisted from this screen. Business profile, imports, and server-side configuration are managed during deployment and handover.
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle icon={ShieldCheck}>Security</CardTitle>
            <div className="space-y-2">
              <ActionButton label="Change Password" sub="Open the secure reset-code flow for the current account." onClick={() => router.push('/forgot-password')} />
              <ActionButton label="Staff & Roles" sub="Manage users and role assignments." onClick={() => router.push('/staff')} />
              <ActionButton label="Activity Log" sub="Review staff actions and security-sensitive events." onClick={() => router.push('/activity-log')} />
            </div>
            <div className="mt-4 rounded-lg bg-[var(--green-light)] p-3 text-[12px] text-[var(--green-dark)]">
              Active sessions can be revoked below. Two-factor authentication is intentionally not shown yet because it is not wired for production use.
            </div>
          </Card>

          <Card>
            <CardTitle icon={Database}>Backup & Recovery</CardTitle>
            <div className="space-y-2">
              {BACKUP_ITEMS.map((item) => (
                <div key={item} className="rounded-lg bg-[var(--bg)] p-3 text-[12px] text-[var(--text-muted)]">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-[12px] text-[var(--text-muted)]">
              This system does not trigger cloud backups directly from the browser. Backup execution is a server-side operational task handled by the deployment runbook.
            </div>
          </Card>

          <Card>
            <CardTitle icon={Building2}>Operations</CardTitle>
            <div className="space-y-2">
              <ActionButton label="Branches" sub="Manage locations and stock transfers." onClick={() => router.push('/branches')} />
              <ActionButton label="Recycle Bin" sub="Restore soft-deleted records before launch." onClick={() => router.push('/recycle-bin')} />
              <ActionButton label="Reports" sub="Review sales, inventory, financial, and customer analytics." onClick={() => router.push('/reports')} />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardTitle icon={Users}>System Readiness</CardTitle>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {READINESS_ITEMS.map((item) => (
                <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium text-[var(--text)]">{item.label}</p>
                    <span className="rounded-full bg-[var(--green-light)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--green-dark)]">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)]">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <SessionsManager />
        </div>
      </div>
    </>
  );
}

function ToggleSetting({ label, sub, checked, onChange, icon }: { label: string; sub: string; checked: boolean; onChange: () => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-[13px] font-medium">{label}</p>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">{sub}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[var(--green)]' : 'bg-[var(--border)]'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function ActionButton({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-left hover:bg-[var(--border)]"
    >
      <div>
        <p className="text-[13px] font-medium text-[var(--text)]">{label}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{sub}</p>
      </div>
      <span className="pt-0.5 text-[11px] font-semibold text-[var(--green)]">Open</span>
    </button>
  );
}
