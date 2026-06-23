export const metadata = { title: 'Offline — Maxbuy Ventures' };

export default function OfflinePage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: 'linear-gradient(135deg, #0d2b1f 0%, #071410 100%)' }}
    >
      <div className="mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-[16px] bg-[#0b8c5c] text-[30px]">
        🛒
      </div>
      <h1 className="font-display text-[22px] font-extrabold text-white">You&apos;re offline</h1>
      <p className="mt-2 max-w-xs text-[13px] text-white/70">
        This page hasn&apos;t been cached yet. Pages you&apos;ve already visited — including the POS —
        keep working offline, and any sales you record will sync automatically once you&apos;re back online.
      </p>
      <a
        href="/pos"
        className="mt-6 rounded-[10px] bg-[#0b8c5c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a7a50]"
      >
        Go to Point of Sale
      </a>
    </div>
  );
}
