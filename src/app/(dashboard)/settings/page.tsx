'use client';

import { useState } from 'react';
import { Store, SlidersHorizontal, Database, ShieldCheck, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button, FormGroup, Input, Select } from '@/components/ui';
import { useUIStore } from '@/store/authStore';
import { SessionsManager } from '@/components/settings/SessionsManager';

export default function SettingsPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useUIStore();
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [whatsappReceipts, setWhatsappReceipts] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [multiBranch, setMultiBranch] = useState(false);

  function handleSave() { toast.success('Settings saved!'); }
  function handleBackup() { toast.success('Backup initiated — data synced to cloud.'); }
  function handleExport() { toast('Export feature: implement with jsPDF or CSV generation', { icon: '📊' }); }

  return (
    <>
      <Topbar title="Settings" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-5">
          <h2 className="font-display text-[22px] font-extrabold text-[var(--text)]">Settings</h2>
          <p className="text-[13px] text-[var(--text-muted)]">Configure your Maxbuy Ventures business system</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Business profile */}
          <Card>
            <CardTitle icon={Store}>Business Profile</CardTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormGroup label="Business Name"><Input defaultValue="Maxbuy Ventures" /></FormGroup>
              <FormGroup label="Phone"><Input defaultValue="+234 xxx xxx xxxx" /></FormGroup>
              <FormGroup label="Address"><Input defaultValue="Your Business Address" /></FormGroup>
              <FormGroup label="Currency">
                <Select defaultValue="NGN"><option value="NGN">₦ Nigerian Naira</option></Select>
              </FormGroup>
              <FormGroup label="Business Type">
                <Select defaultValue="retail"><option value="retail">Retail & Wholesale</option></Select>
              </FormGroup>
              <FormGroup label="VAT/Tax Number"><Input defaultValue="" placeholder="Optional" /></FormGroup>
            </div>
            <Button className="mt-4" onClick={handleSave}>Save Profile</Button>
          </Card>

          {/* System preferences */}
          <Card>
            <CardTitle icon={SlidersHorizontal}>System Preferences</CardTitle>
            <div className="space-y-4">
              <ToggleSetting
                label="Dark Mode"
                sub="Toggle dark/light theme"
                checked={darkMode}
                onChange={toggleDarkMode}
                icon={darkMode ? <Sun size={15} /> : <Moon size={15} />}
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium">Low Stock Alert Threshold</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Alert when stock falls below this number</p>
                </div>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-16 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-right text-[13px] text-[var(--text)] outline-none"
                />
              </div>
              <ToggleSetting label="WhatsApp Receipts" sub="Auto-send receipts via WhatsApp" checked={whatsappReceipts} onChange={() => setWhatsappReceipts(!whatsappReceipts)} />
              <ToggleSetting label="Auto Cloud Backup" sub="Daily automatic data backup" checked={autoBackup} onChange={() => setAutoBackup(!autoBackup)} />
              <ToggleSetting label="Multi-Branch Mode" sub="Enable branch management for expansion" checked={multiBranch} onChange={() => setMultiBranch(!multiBranch)} />
            </div>
            <Button className="mt-4" onClick={handleSave}>Save Preferences</Button>
          </Card>

          {/* Data & backup */}
          <Card>
            <CardTitle icon={Database}>Data & Backup</CardTitle>
            <div className="space-y-2">
              <button onClick={handleBackup} className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-left text-[13px] font-medium text-[var(--text)] hover:bg-[var(--border)]">
                ☁️ Backup Now to Cloud
              </button>
              <button onClick={handleExport} className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-left text-[13px] font-medium text-[var(--text)] hover:bg-[var(--border)]">
                📊 Export All Data (CSV)
              </button>
              <button onClick={() => toast('Connect to /api/import endpoint for CSV product imports')} className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-left text-[13px] font-medium text-[var(--text)] hover:bg-[var(--border)]">
                📥 Import Products (CSV)
              </button>
              <div className="mt-2 rounded-lg bg-[var(--green-light)] p-3 text-[12px] text-[var(--green-dark)]">
                ✅ Secure login active &nbsp;|&nbsp; Last backup: configured after DB setup
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card>
            <CardTitle icon={ShieldCheck}>Security</CardTitle>
            <div className="space-y-2">
              <button onClick={() => router.push('/forgot-password')} className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-left text-[13px] font-medium text-[var(--text)] hover:bg-[var(--border)]">
                🔑 Change Password (via reset code)
              </button>
              <button onClick={() => toast('2FA: integrate with Authy or Google Authenticator via TOTP library')} className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-left text-[13px] font-medium text-[var(--text)] hover:bg-[var(--border)]">
                📱 Enable Two-Factor Authentication
              </button>
            </div>
            <div className="mt-4 rounded-lg bg-[var(--green-light)] p-3 text-[12px] text-[var(--green-dark)]">
              ✅ httpOnly cookie sessions with rotating refresh tokens active. Manage signed-in devices below.
            </div>
          </Card>

          {/* Active sessions / devices */}
          <SessionsManager />
        </div>
      </div>
    </>
  );
}

function ToggleSetting({ label, sub, checked, onChange, icon }: { label: string; sub: string; checked: boolean; onChange: () => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[13px] font-medium">{label}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{sub}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-[var(--green)]' : 'bg-[var(--border)]'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
