import {
  FULFILLMENT_STATUSES,
  type FulfillmentItem,
  type FulfillmentStatus,
} from '../types/fulfillment.types';

// The release is a confirmation-only flow — ids + optional warehouse come
// from the selection state, so there is NO field-level form schema here.
// Validation is structural: 1–100 order ids, integers >= 1.
export function normalizeOrderIds(ids: Array<number | string>): number[] {
  const seen = new Set<number>();
  for (const raw of ids) {
    const value = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isInteger(value) && value >= 1) seen.add(value);
  }
  return [...seen];
}

/** Server cap on order_ids — mirrors `max:100` on ReleaseFulfillmentRequest. */
export const RELEASE_BULK_MAX = 100;

export const RELEASE_RESERVED_KEY_PREFIX = 'auto-release-order-';

export function isValidIdempotencyKey(key: string): boolean {
  return key.length <= 64 && !key.startsWith(RELEASE_RESERVED_KEY_PREFIX);
}

/** Live engine refusals: only in-flight states make sense for these actions. */
export const CANCELLABLE_STATUSES: FulfillmentStatus[] = [
  'pending',
  'picking',
  'picked',
  'packing',
  'ready_to_ship',
];

export const SHIPPABLE_STATUS: FulfillmentStatus = 'ready_to_ship';

/** create-tasks serves pending (advance) and picking (idempotent reuse). */
export const TASK_CREATABLE_STATUSES: FulfillmentStatus[] = ['pending', 'picking'];

/** create-packing-task is served from `picked` only (service-refused otherwise). */
export const PACKING_CREATABLE_STATUS: FulfillmentStatus = 'picked';

export const PICKING_COMPLETABLE_STATUSES: FulfillmentStatus[] = ['picking'];

export function isFulfillmentStatus(value: unknown): value is FulfillmentStatus {
  return (
    typeof value === 'string' &&
    (FULFILLMENT_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeQuantity(value: number | string | undefined): string {
  if (value === undefined || value === null) return '0';
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(num) ? String(value) : String(num);
}

export function itemProgress(
  item: FulfillmentItem
): { picked: number; total: number } {
  const total = Number(item.quantity) || 0;
  const picked = Number(item.quantity_picked) || 0;
  return { picked, total };
}
