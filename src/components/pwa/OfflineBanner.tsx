'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { WifiOff, CloudUpload, RefreshCw } from 'lucide-react';
import { getPendingCount, QUEUE_UPDATED_EVENT } from '@/lib/offline/queue';
import { syncPendingSales } from '@/lib/offline/sync';
import { showLocalNotification } from '@/lib/offline/pushNotify';

// Global offline/sync status bar. Also owns the auto-sync lifecycle: it flushes
// queued sales when connectivity returns, on first load, and when the service
// worker's Background Sync fires.
export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    setPending(await getPendingCount());
  }, []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    try {
      const r = await syncPendingSales();
      if (r.synced > 0) {
        toast.success(`${r.synced} offline sale${r.synced > 1 ? 's' : ''} synced`);
        if (typeof document !== 'undefined' && document.hidden) {
          showLocalNotification('Maxbuy — sales synced', `${r.synced} offline sale${r.synced > 1 ? 's' : ''} uploaded successfully.`, '/sales');
        }
      }
      if (r.conflicts > 0) {
        toast.error(`${r.conflicts} queued sale${r.conflicts > 1 ? 's' : ''} need attention (stock conflict)`);
        showLocalNotification('Maxbuy — sync needs attention', `${r.conflicts} queued sale${r.conflicts > 1 ? 's' : ''} could not be synced (stock conflict).`, '/pos');
      }
    } finally {
      setSyncing(false);
      await refreshCount();
    }
  }, [refreshCount]);

  useEffect(() => {
    setOnline(navigator.onLine);
    refreshCount();

    const onOnline = () => {
      setOnline(true);
      runSync();
    };
    const onOffline = () => setOnline(false);
    const onQueue = () => refreshCount();
    const onSwSync = () => runSync();

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener(QUEUE_UPDATED_EVENT, onQueue);
    window.addEventListener('maxbuy:sync-sales', onSwSync);

    if (navigator.onLine) runSync(); // catch up anything queued from a previous session

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener(QUEUE_UPDATED_EVENT, onQueue);
      window.removeEventListener('maxbuy:sync-sales', onSwSync);
    };
  }, [refreshCount, runSync]);

  if (online && pending === 0) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-1.5 text-[12px] font-medium ${
        online ? 'bg-[var(--amber-light)] text-amber-800' : 'bg-[var(--red-light)] text-[var(--red)]'
      }`}
    >
      {!online ? (
        <>
          <WifiOff size={13} />
          <span>
            Offline — sales are saved on this device
            {pending > 0 ? ` (${pending} queued)` : ''} and will sync automatically.
          </span>
        </>
      ) : (
        <>
          <CloudUpload size={13} />
          <span>
            {pending} offline sale{pending > 1 ? 's' : ''} pending sync
          </span>
          <button
            onClick={runSync}
            disabled={syncing}
            className="ml-1 inline-flex items-center gap-1 rounded-md bg-white/60 px-2 py-0.5 font-semibold hover:bg-white disabled:opacity-60"
          >
            <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </>
      )}
    </div>
  );
}
