'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'maxbuy-install-dismissed';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[200] flex w-[92%] max-w-sm -translate-x-1/2 items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-2xl">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--green)] text-lg text-white">
        🛒
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[var(--text)]">Install Maxbuy</p>
        <p className="text-[11px] text-[var(--text-muted)]">Add to your device for offline access</p>
      </div>
      <button
        onClick={install}
        className="flex items-center gap-1 rounded-[10px] bg-[var(--green)] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[var(--green-dark)]"
      >
        <Download size={13} /> Install
      </button>
      <button onClick={dismiss} aria-label="Dismiss" className="text-[var(--text-muted)] hover:text-[var(--text)]">
        <X size={16} />
      </button>
    </div>
  );
}
