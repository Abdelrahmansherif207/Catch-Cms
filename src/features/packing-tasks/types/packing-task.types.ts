import type { FulfillmentItem } from '@/features/fulfillments/types/fulfillment.types';

/** Server-closed 6-state set (code-verified ListPackingTasksRequest). */
export const PACKING_TASK_STATUSES = [
  'pending',
  'assigned',
  'packing',
  'packed',
  'verified',
  'cancelled',
] as const;

export type PackingTaskStatus = (typeof PACKING_TASK_STATUSES)[number];

/**
 * Terminal for reads and further commands — assign refuses anything outside
 * `pending/assigned`, cancel refuses `packed/verified/cancelled`.
 */
export const TERMINAL_TASK_STATUSES: PackingTaskStatus[] = [
  'packed',
  'verified',
  'cancelled',
];

/** assign is the only entry point back into the task itself. */
export const ASSIGNABLE_STATUSES: PackingTaskStatus[] = ['pending', 'assigned'];
/** start requires exactly `assigned` (re-pinning an in-progress task 422s). */
export const STARTABLE_STATUSES: PackingTaskStatus[] = ['assigned'];
/** pack requires exactly `packing` (double completion is refused). */
export const PACKABLE_STATUSES: PackingTaskStatus[] = ['packing'];
/** verify requires exactly `packed`. */
export const VERIFIABLE_STATUSES: PackingTaskStatus[] = ['packed'];
/**
 * Cancel is allowed at ANY time (wave-1 cycle update, 2026-10-15): the
 * only non-cancellable state is an already-`cancelled` task. The old
 * KAN-20 packed/verified refusal is retired — the engine adjudicates
 * verbatim if it would still refuse.
 */
export const CANCELLABLE_STATUSES: PackingTaskStatus[] = [
  'pending',
  'assigned',
  'packing',
  'packed',
  'verified',
];

export function isPackingTaskStatus(value: unknown): value is PackingTaskStatus {
  return (
    typeof value === 'string' &&
    (PACKING_TASK_STATUSES as readonly string[]).includes(value)
  );
}

export function isTerminalTask(status: string): boolean {
  return (TERMINAL_TASK_STATUSES as string[]).includes(status);
}

/**
 * List row (GET /admin/packing-tasks) — flat array pages, newest first.
 * Live-verified shape: NO order_id or fulfillment_number on rows.
 */
export interface PackingTaskListItem {
  id: number;
  fulfillment_id: number;
  packing_station_id: number | null;
  assigned_to: number | null;
  status: PackingTaskStatus | string;
  weight: number | null;
  packed_at: string | null;
  verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Slim station block — detail-only, no `status` key (code-verified absence). */
export interface PackingTaskStationRef {
  id: number;
  code: string;
  name: string;
  warehouse_id: number;
}

/**
 * Detail row (GET /admin/packing-tasks/{id}) — index keys plus the
 * detail-only block. `station` is null when the task is unassigned
 * (live-verified). `weight` is a plain number, decimals NOT string-wrapped
 * (unlike picking quantities).
 */
export interface PackingTaskDetail {
  id: number;
  fulfillment_id: number;
  packing_station_id: number | null;
  station: PackingTaskStationRef | null;
  assigned_to: number | null;
  status: PackingTaskStatus | string;
  weight: number | null;
  dimensions: Record<string, number> | null;
  package_materials: string[] | null;
  notes: string | null;
  /** Enriched fulfillment lines (Show contract, 2026-10-15) — null when the
   * inner `items` were not loaded; key gated on the loaded `fulfillment`
   * relation. Items carry the `product`/`variant`/`location` blocks. */
  items: FulfillmentItem[] | null;
  assigned_at: string | null;
  started_at: string | null;
  packed_at: string | null;
  verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PackingTasksListResponseData {
  status: number;
  message: string;
  success: boolean;
  data: PackingTaskListItem[];
}

export interface PackingTaskDetailResponseData {
  status: number;
  message: string;
  success: boolean;
  data: PackingTaskDetail;
}

/** Response of POST /admin/fulfillments/{id}/create-packing-task (201 fresh). */
export type CreatePackingTaskResponseData = PackingTaskDetailResponseData;

export interface FetchPackingTasksParams {
  /** Globals only — scoped callers are confined to home (filter ignored). */
  warehouseId?: number;
  /** Unknown station ids 404 (lookup miss), not 422. */
  stationId?: number;
  /** Unknown fulfillment ids 404 (anti-enumeration), not 422. */
  fulfillmentId?: number;
  status?: PackingTaskStatus;
  /** No `mine` param exists — "my queue" = this filter = caller id. */
  assignedTo?: number;
  /** Server cap 1–100. */
  limit?: number;
}

export interface AssignPackingTaskData {
  /** NO exists rule — ghost ids surface as a framework-text 422 in-service. */
  station_id: number;
}

export interface PackPackingTaskData {
  weight: number;
  /** Non-empty map of numerics, e.g. {length: 30, width: 20, height: 10}. */
  dimensions: Record<string, number>;
  materials?: string[] | null;
  notes?: string | null;
}

export interface VerifyPackingTaskData {
  /** Stored as `notes ?? locked.notes` — omit keeps existing. */
  notes?: string | null;
}

export interface CancelPackingTaskData {
  /** Whitespace-only passes min:1 at validation but 422s at the service. */
  reason: string;
}
