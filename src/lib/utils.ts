import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format a number as Nigerian Naira currency */
export function formatCurrency(amount: number): string {
  return '₦' + Math.round(amount).toLocaleString('en-NG');
}

/** Format a date for display */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Days remaining until a given date (negative if in the past) */
export function daysUntil(date: string | Date): number {
  const target = new Date(date);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Generate the next sequential invoice number, e.g. INV-0001 */
export function nextInvoiceNumber(lastNumber: number): string {
  return `INV-${String(lastNumber + 1).padStart(4, '0')}`;
}

/** Determine stock status for a product */
export type StockStatus = 'out' | 'low' | 'ok';
export function getStockStatus(stockQuantity: number, lowStockAlert: number): StockStatus {
  if (stockQuantity <= 0) return 'out';
  if (stockQuantity <= lowStockAlert) return 'low';
  return 'ok';
}

/** Determine expiry status */
export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'good';
export function getExpiryStatus(expiryDate: string | Date | null | undefined): ExpiryStatus | null {
  if (!expiryDate) return null;
  const days = daysUntil(expiryDate);
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'good';
}
