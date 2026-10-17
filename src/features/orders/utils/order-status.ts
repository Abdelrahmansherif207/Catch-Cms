export const ORDER_STATUSES = [
  'pending',
  'processing',
  'completed',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type StatusTone =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'muted'
  | 'processing'
  | 'violet'
  | 'cyan'
  | 'indigo'
  | 'primary';

export const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'border-transparent bg-success-soft text-success',
  warning: 'border-transparent bg-warning-soft text-warning',
  destructive: 'border-transparent bg-destructive-soft text-destructive',
  info: 'border-transparent bg-info-soft text-info',
  muted: 'border-transparent bg-muted text-muted-foreground',
  processing: 'border-transparent bg-processing-soft text-processing',
  violet: 'border-transparent bg-violet-soft text-violet',
  cyan: 'border-transparent bg-cyan-soft text-cyan',
  indigo: 'border-transparent bg-indigo-soft text-indigo',
  primary: 'border-transparent bg-primary/10 text-primary',
};

/**
 * Order-status → tone. Includes statuses beyond the 5 transition targets
 * (backend order engine also emits refunded/failed/on_hold) plus the
 * backend payment-status aliases so list badges never render unstyled.
 */
export const ORDER_TONES: Record<string, StatusTone> = {
  pending: 'warning',
  awaiting_payment: 'warning',
  on_hold: 'warning',
  processing: 'processing',
  shipped: 'info',
  completed: 'success',
  delivered: 'success',
  cancelled: 'destructive',
  failed: 'destructive',
  refunded: 'violet',
};

/**
 * Payment-status → tone. Keys cover the raw DB values (payment-*) AND the
 * backend alias expansion of GET /admin/tracking/orders?payment_status=
 * (paid/success/PAYMENT_STATUS_SUCCESS → paid family, etc.).
 */
export const PAYMENT_TONES: Record<string, StatusTone> = {
  'payment-success': 'success',
  paid: 'success',
  success: 'success',
  PAYMENT_STATUS_SUCCESS: 'success',
  'payment-pending': 'warning',
  pending: 'warning',
  PAYMENT_STATUS_PENDING: 'warning',
  'payment-failed': 'destructive',
  failed: 'destructive',
  PAYMENT_STATUS_FAILED: 'destructive',
  refunded: 'violet',
  PAYMENT_STATUS_REFUNDED: 'violet',
};

export function getAllowedStatusTransitions(): Array<{
  value: OrderStatus;
  disabled: boolean;
}> {
  return ORDER_STATUSES.map((status) => ({ value: status, disabled: false }));
}
