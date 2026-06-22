'use client';

import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CartItem } from '@/types';
import { Printer, MessageCircle, X } from 'lucide-react';

interface ReceiptData {
  invoiceNumber: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  discountPct: number;
  total: number;
  paymentMethod: string;
}

interface ReceiptModalProps {
  data: ReceiptData;
  onClose: () => void;
}

export function ReceiptModal({ data, onClose }: ReceiptModalProps) {
  function handlePrint() { window.print(); }

  function handleWhatsApp() {
    const lines = [
      `🛒 *Maxbuy Ventures Receipt*`,
      `Invoice: ${data.invoiceNumber}`,
      `Customer: ${data.customerName}`,
      ``,
      ...data.items.map((i) => `• ${i.name} x${i.quantity} = ${formatCurrency(i.price * i.quantity)}`),
      ``,
      `Subtotal: ${formatCurrency(data.subtotal)}`,
      data.discountPct > 0 ? `Discount: ${data.discountPct}%` : '',
      `*TOTAL: ${formatCurrency(data.total)}*`,
      `Payment: ${data.paymentMethod}`,
      ``,
      `Thank you for shopping at Maxbuy Ventures! 😊`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
  }

  const discountAmount = data.subtotal * (data.discountPct / 100);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-[90%] max-w-sm overflow-y-auto rounded-[14px] bg-[var(--card)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5">
          <h3 className="font-display text-base font-bold text-[var(--text)]">Sale Receipt</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)]"><X size={14} /></button>
        </div>
        <div className="px-5 py-4">
          <div className="rounded-xl border border-[var(--border)] p-5">
            <div className="mb-4 text-center">
              <div className="font-display text-lg font-extrabold text-[var(--green)]">🛒 Maxbuy Ventures</div>
              <p className="text-[11px] text-[var(--text-muted)]">Your Trusted Shopping Partner</p>
              <p className="text-[11px] text-[var(--text-muted)]">{formatDateTime(new Date())}</p>
            </div>
            <div className="border-t border-dashed border-[var(--border)] pt-3">
              <ReceiptRow label="Invoice #" value={data.invoiceNumber} bold />
              <ReceiptRow label="Customer" value={data.customerName} />
              <ReceiptRow label="Payment" value={data.paymentMethod.toUpperCase()} />
            </div>
            <div className="my-3 border-t border-dashed border-[var(--border)] pt-3">
              {data.items.map((item) => (
                <div key={item.productId} className="mb-1.5 flex justify-between text-[12px]">
                  <span>{item.emoji} {item.name} x{item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-[var(--border)] pt-3">
              <ReceiptRow label="Subtotal" value={formatCurrency(data.subtotal)} />
              {data.discountPct > 0 && <ReceiptRow label={`Discount (${data.discountPct}%)`} value={`-${formatCurrency(discountAmount)}`} className="text-[var(--red)]" />}
              <div className="mt-2 flex justify-between">
                <span className="text-sm font-bold text-[var(--text)]">TOTAL</span>
                <span className="font-display text-base font-extrabold text-[var(--green)]">{formatCurrency(data.total)}</span>
              </div>
            </div>
            <div className="mt-4 border-t border-dashed border-[var(--border)] pt-3 text-center text-[11px] text-[var(--text-muted)]">Thank you for shopping at Maxbuy Ventures!<br />Come again 😊</div>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={handlePrint} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--border)]"><Printer size={13} /> Print</button>
          <button onClick={handleWhatsApp} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--amber)] bg-[var(--amber-light)] py-2 text-xs font-medium text-amber-800"><MessageCircle size={13} /> WhatsApp</button>
          <button onClick={onClose} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--green)] py-2 text-xs font-medium text-white hover:bg-[var(--green-dark)]">Done</button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, bold, className }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className={`mb-1 flex justify-between text-[12px] ${bold ? 'font-bold' : ''} ${className || ''}`}>
      <span className={bold ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
