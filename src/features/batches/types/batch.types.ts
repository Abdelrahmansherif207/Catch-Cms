/** Server-closed 5-state set (code-verified ListBatchesRequest). */
export const BATCH_STATUSES = [
  'pending',
  'assigned',
  'picking',
  'completed',
  'cancelled',
] as const;

export type BatchStatus = (typeof BATCH_STATUSES)[number];

export function isBatchStatus(value: unknown): value is BatchStatus {
  return (
    typeof value === 'string' &&
    (BATCH_STATUSES as readonly string[]).includes(value)
  );
}

export function isTerminalBatch(status: string): boolean {
  return status === 'completed' || status === 'cancelled';
}

/**
 * List row (GET /admin/batches) — flat array pages, newest first.
 * progress is the server-computed completion percentage.
 */
export interface BatchListItem {
  id: number;
  batch_number: string;
  warehouse_id: number;
  status: BatchStatus | string;
  type: string;
  assigned_to: number | null;
  total_items: number;
  picked_items: number;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** One task row inside the batch detail (PickingTaskResource keys). */
export interface BatchTaskRow {
  id: number;
  batch_id: number | null;
  fulfillment_item_id: number;
  order_id: number;
  product_location_id: number | null;
  quantity_to_pick: number | string;
  quantity_picked: number | string;
  remaining: number;
  status: string;
  sequence: number | null;
  claimed_by: number | null;
  claimed_at: string | null;
  claim_expires_at: string | null;
  picked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Detail row (GET /admin/batches/{id}) — list keys plus the
 * sequence-ordered tasks. No `allowed_actions` key exists.
 */
export interface BatchDetail extends Omit<BatchListItem, 'status'> {
  status: BatchStatus | string;
  tasks: BatchTaskRow[];
  notes: string | null;
}

export interface BatchesListResponseData {
  status: number;
  message: string;
  success: boolean;
  data: BatchListItem[];
}

export interface BatchDetailResponseData {
  status: number;
  message: string;
  success: boolean;
  data: BatchDetail;
}

/**
 * next-task success WITH a pending task. The EMPTY variant (200 without
 * a `data` key) is typed separately — see NextTaskEmptyResponse.
 */
export interface NextTaskResponseData {
  status: number;
  message: string;
  success: boolean;
  data: BatchTaskRow;
}

/** next-task success with NO pending task — NO `data` key by design. */
export interface NextTaskEmptyResponse {
  status: number;
  message: string;
  success: boolean;
  data?: never;
}

export type NextTaskResponse = NextTaskResponseData | NextTaskEmptyResponse;

/**
 * Guard against non-row payloads: the EMPTY variant omits `data`, but a
 * defensive check also rejects arrays / id-less objects so callers never
 * navigate to `/picking-tasks/undefined`.
 */
export function hasNextTask(response: NextTaskResponse): response is NextTaskResponseData {
  const data = response.data as unknown;
  return (
    data !== undefined &&
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof (data as BatchTaskRow).id === 'number'
  );
}

/**
 * Pending fulfillment row (GET /admin/batches/pending-fulfillments).
 * NOTE: items_count/shipments_count are ALWAYS 0 on this path (no count
 * eager-load) — the picker UI must not display them as meaningful.
 */
export interface PendingFulfillmentRow {
  id: number;
  fulfillment_number: string;
  order_id: number;
  warehouse_id: number;
  status: string;
  priority: unknown;
  assigned_to: number | null;
  items_count: number;
  shipments_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface PendingFulfillmentsResponseData {
  status: number;
  message: string;
  success: boolean;
  data: PendingFulfillmentRow[];
}

export interface FetchBatchesParams {
  warehouseId?: number;
  status?: BatchStatus;
  assignedTo?: number;
  /** Truthy 1 → batches assigned to the caller. */
  mine?: boolean;
  /** Server cap 1–100. */
  limit?: number;
}

export interface CreateBatchData {
  fulfillment_ids?: number[];
  order_ids?: number[];
  warehouse_id?: number;
  type?: 'wave';
  idempotency_key?: string;
}

export interface AssignBatchData {
  user_id: number;
  reassign?: boolean;
}

export interface BatchCommandData {
  reason: string;
}

/**
 * retry returns the REPLACEMENT task rows (possibly []) — NOT the batch.
 * An empty array is a distinct success ("Nothing retryable").
 */
export interface RetrySkippedResponseData {
  status: number;
  message: string;
  success: boolean;
  data: BatchTaskRow[];
}
