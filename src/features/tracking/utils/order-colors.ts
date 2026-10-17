import type { TrackingOrderRow } from '../types/tracking.types';

/**
 * Row-level staleness accent for the tracking orders table — the visual
 * counterpart of the relative-date filters (older_than / within_days):
 * open orders (pending/processing) older than 7 days get an amber left
 * border, past 30 days a red one. Terminal statuses are never accented.
 */
export function stalenessAccent(order: Pick<TrackingOrderRow, 'status' | 'created_at'>): string {
  if (order.status !== 'pending' && order.status !== 'processing') return '';
  const created = new Date(order.created_at).getTime();
  if (Number.isNaN(created)) return '';
  const ageDays = (Date.now() - created) / 86_400_000;
  if (ageDays >= 30) return 'border-l-4 border-l-destructive';
  if (ageDays >= 7) return 'border-l-4 border-l-warning';
  return '';
}

/**
 * payment_status filter values — raw DB values (payment-*) plus the backend
 * alias inputs ('paid', 'refunded') that the server expands before whereIn.
 */
export const TRACKING_PAYMENT_STATUSES = [
  'payment-success',
  'payment-pending',
  'payment-failed',
  'paid',
  'refunded',
] as const;
