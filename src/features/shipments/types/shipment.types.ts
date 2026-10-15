import type { ApiResponse } from '@/features/fulfillments/types/fulfillment.types';

/**
 * Shipment lifecycle (Shipment::allowedTransitions family, live-verified):
 * label_created → picked_up → in_transit → out_for_delivery → delivered;
 * cancelled refuses terminal rows and refuses anything post-shipped.
 */
export const SHIPMENT_STATUSES = [
  'label_created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

/** Dispatch requires exactly `label_created` (duplicate dispatch 422s). */
export const DISPATCHABLE_STATUSES: ShipmentStatus[] = ['label_created'];

/**
 * Deliver walks the chain (picked_up → … → delivered) — anything dispatched
 * but not terminal is deliverable; re-delivery is a safe 200 replay;
 * pre-dispatch (label_created) is refused.
 */
export const DELIVERABLE_STATUSES: ShipmentStatus[] = [
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

/** Cancel is visible on every state except already-cancelled; the engine
 * adjudicates post-dispatch/backward refusals with verbatim 422 texts. */
export const CANCELLABLE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  'label_created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

export function isDispatchable(status: string): boolean {
  return (DISPATCHABLE_STATUSES as string[]).includes(status);
}

export function isDeliverable(status: string): boolean {
  return (DELIVERABLE_STATUSES as string[]).includes(status);
}

export function isShipmentCancellable(status: string): boolean {
  return (CANCELLABLE_SHIPMENT_STATUSES as string[]).includes(status);
}

/** GET /admin/shipments — list row (14 keys, fulfillment-scoped page). */
export interface ShipmentListItem {
  id: number;
  uuid: string | null;
  order_id: number | null;
  fulfillment_id: number | null;
  tracking_number: string | null;
  courier: string | null;
  status: ShipmentStatus | string;
  shipping_method: string | null;
  total_weight: number | string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * GET /admin/shipments/{id} — full ShipmentDetailResource (24 keys).
 * WMS visibility is fail-closed: rows with a null fulfillment_id 404 on
 * this surface (order-only legacy labels are outside it).
 */
export interface ShipmentDetail {
  id: number;
  uuid: string | null;
  order_id: number | null;
  fulfillment_id: number | null;
  packing_task_id: number | null;
  tracking_number: string | null;
  courier: string | null;
  status: ShipmentStatus | string;
  shipping_method: string | null;
  shipping_cost: number | string | null;
  currency: string | null;
  total_weight: number | string | null;
  origin_address: Record<string, unknown> | null;
  destination_address: Record<string, unknown> | null;
  notes: string | null;
  cancel_reason: string | null;
  cancel_source: string | null;
  cancelled_by: number | null;
  shipped_at: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type ShipmentsListResponse = ApiResponse<ShipmentListItem[]>;
export type ShipmentDetailResponse = ApiResponse<ShipmentDetail>;

export interface FetchShipmentsParams {
  /**
   * Optional picker — when omitted the page loads ALL shipments in scope
   * (bare /admin/shipments); when set, rows narrow to that fulfillment.
   */
  fulfillmentId?: number | string;
  status?: ShipmentStatus | string;
  /** Page size — capped at 100 server-side. */
  limit?: number;
}

/** POST /admin/shipments/{id}/dispatch | deliver — shared notes payload. */
export interface ShipmentNotesData {
  notes?: string | null;
}

/** POST /admin/shipments/{id}/cancel */
export interface CancelShipmentData {
  reason: string;
}

/** Bulk result rows (bulk-dispatch / bulk-deliver, always HTTP 200). */
export interface BulkShipmentActionRow {
  shipment_id: number;
  tracking_number: string | null;
  status: ShipmentStatus | string;
  fulfillment_id: number | null;
}

export interface BulkShipmentFailedRow {
  shipment_id: number;
  tracking_number?: string | null;
  reason: string;
}

export interface BulkShipmentActionResult {
  successful: BulkShipmentActionRow[];
  failed: BulkShipmentFailedRow[];
  summary: {
    total: number;
    success_count: number;
    failed_count: number;
  };
}

export interface BulkShipmentActionData {
  shipment_ids: number[];
  notes?: string | null;
}

export type BulkShipmentActionResponse = ApiResponse<BulkShipmentActionResult>;
