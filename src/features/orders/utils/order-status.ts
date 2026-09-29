export const ORDER_STATUSES = [
  'pending',
  'processing',
  'completed',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function getAllowedStatusTransitions(): Array<{
  value: OrderStatus;
  disabled: boolean;
}> {
  return ORDER_STATUSES.map((status) => ({ value: status, disabled: false }));
}
