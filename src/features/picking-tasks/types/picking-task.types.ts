/** Server-closed 6-state set (code-verified ListPickingTasksRequest). */
export const PICKING_TASK_STATUSES = [
  'pending',
  'assigned',
  'picking',
  'picked',
  'skipped',
  'cancelled',
] as const;

export type PickingTaskStatus = (typeof PICKING_TASK_STATUSES)[number];

/** Terminal states — no claim/release/confirm/skip/reallocate accepted. */
export const TERMINAL_TASK_STATUSES: PickingTaskStatus[] = [
  'picked',
  'skipped',
  'cancelled',
];

export function isPickingTaskStatus(value: unknown): value is PickingTaskStatus {
  return (
    typeof value === 'string' &&
    (PICKING_TASK_STATUSES as readonly string[]).includes(value)
  );
}

export function isTerminalTask(status: string): boolean {
  return (TERMINAL_TASK_STATUSES as string[]).includes(status);
}

/**
 * List row (GET /admin/picking-tasks) — flat array pages, decimals as
 * strings ("2.00") plus a computed numeric `remaining`.
 */
export interface PickingTaskListItem {
  id: number;
  batch_id: number | null;
  fulfillment_item_id: number;
  order_id: number;
  product_location_id: number | null;
  quantity_to_pick: number | string;
  quantity_picked: number | string;
  remaining: number;
  status: PickingTaskStatus | string;
  sequence: number | null;
  claimed_by: number | null;
  claimed_at: string | null;
  /** 15-min lease from claim time (server default). */
  claim_expires_at: string | null;
  picked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Shelf identity block inside the detail `location` key. */
export interface PickingTaskLocation {
  id: number;
  location_id: number;
  warehouse_id: number;
  code: string;
  name: string | null;
  barcode: string | null;
  type: string | null;
  status: string | null;
}

export interface PickingTaskFulfillmentRef {
  id: number;
  fulfillment_number: string;
  warehouse_id: number;
  status: string;
}

/** One scan-log entry shape is open — kept loose deliberately. */
export interface PickingTaskScanEntry {
  [key: string]: unknown;
}

/**
 * Detail row (GET /admin/picking-tasks/{id}) — index keys plus the
 * detail-only block. `fulfillment` may be omitted when the item chain
 * does not resolve; `location` is null without a placement.
 */
export interface PickingTaskDetail extends Omit<
  PickingTaskListItem,
  'status'
> {
  status: PickingTaskStatus | string;
  fulfillment?: PickingTaskFulfillmentRef;
  location: PickingTaskLocation | null;
  op_seq: number;
  scan_log: PickingTaskScanEntry[];
  notes: string | null;
}

export interface PickingTasksListResponseData {
  status: number;
  message: string;
  success: boolean;
  data: PickingTaskListItem[];
}

export interface PickingTaskDetailResponseData {
  status: number;
  message: string;
  success: boolean;
  data: PickingTaskDetail;
}

export interface FetchPickingTasksParams {
  warehouseId?: number;
  batchId?: number;
  fulfillmentId?: number;
  status?: PickingTaskStatus;
  /** Truthy 1 → caller-claimed only. */
  mine?: boolean;
  /** Server cap 1–100. */
  limit?: number;
}

export interface ClaimTaskData {
  override?: boolean;
}

export interface RecordPickData {
  quantity: number;
  notes?: string | null;
  op_seq?: number;
  override?: boolean;
}

export interface ConfirmPickData {
  location: string;
  product: string;
  quantity: number;
  op_seq?: number;
  override?: boolean;
}

export interface SkipTaskData {
  reason: string;
}

export interface ReallocateTaskData {
  product_location_id: number;
}
