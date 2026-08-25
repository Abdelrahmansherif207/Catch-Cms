import type { OrderStatus } from '../types/order.types';

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'completed',
  'delivered',
  'cancelled',
] as const;

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'completed', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function getAllowedStatusTransitions(
  current: string
): Array<{ value: OrderStatus; disabled: boolean }> {
  const currentStatus = (ORDER_STATUSES as readonly string[]).includes(current)
    ? (current as OrderStatus)
    : null;

  if (!currentStatus) {
    return ORDER_STATUSES.map((status) => ({ value: status, disabled: false }));
  }

  return ORDER_STATUSES.map((status) => ({
    value: status,
    disabled:
      status !== currentStatus &&
      !ORDER_STATUS_TRANSITIONS[currentStatus].includes(status),
  }));
}
