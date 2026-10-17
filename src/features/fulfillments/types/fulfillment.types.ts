export const FULFILLMENT_STATUSES = [
  'pending',
  'picking',
  'picked',
  'packing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export type FulfillmentPriority = 'low' | 'normal' | 'high' | 'urgent' | null;

export interface FulfillmentListItem {
  id: number;
  fulfillment_number: string;
  order_id: number;
  warehouse_id: number;
  status: FulfillmentStatus;
  priority: FulfillmentPriority;
  assigned_to: number | null;
  items_count: number;
  shipments_count: number;
  created_at: string;
  updated_at: string;
}

export interface FulfillmentOrderRef {
  id: number;
  order_number: string;
  status: string;
}

export interface FulfillmentWarehouseRef {
  id: number;
  code: string;
  name: string;
  status: string;
}

/**
 * Live contract (Fulfillment – Show / Packing Tasks – Show, 2026-10-15):
 * the detail endpoints enrich every item with nullable foreign reads via
 * `FormatsWmsProductVariant`; `location.id` is the productLocation pivot id
 * while `code`/`name`/`barcode` come from the nested warehouse location.
 * `quantity`/`quantity_picked` are now backend-cast floats (no strings).
 */
export interface WmsProductRef {
  id: number;
  name: string;
  sku: string;
  product_type: string;
  thumbnail: string | null;
}

/** Live-verified variant attribute row — the backend sends objects
 * (keys: attribute, value, attribute_id, attribute_value_id), never strings. */
export interface WmsVariantAttribute {
  attribute: string;
  value: string;
  attribute_id: number;
  attribute_value_id: number;
}

export interface WmsVariantRef {
  id: number;
  sku: string;
  price: number;
  stock_quantity: number;
  attributes: WmsVariantAttribute[];
}

export interface WmsLocationRef {
  id: number;
  code: string;
  name: string;
  barcode: string | null;
}

export interface FulfillmentItem {
  id: number;
  order_item_id: number;
  product_id: number;
  product_variant_id: number | null;
  product_location_id: number | null;
  quantity: number;
  quantity_picked: number;
  status: string;
  product: WmsProductRef | null;
  variant: WmsVariantRef | null;
  location: WmsLocationRef | null;
}

export interface PickingTask {
  id: number;
  fulfillment_item_id: number;
  batch_id: number | null;
  /** Pinned placement — present on the fulfillment-detail payload. */
  product_location_id: number | null;
  status: string;
  claimed_by: number | null;
  quantity_to_pick: number | string;
  quantity_picked: number | string;
}

export interface PackingTask {
  id: number;
  status: string;
  packing_station_id: number | null;
  assigned_to: number | null;
}

export interface FulfillmentPackage {
  id: number;
  packing_task_id: number | null;
  status: string;
  package_number: string;
}

export interface FulfillmentShipment {
  id: number;
  uuid?: string;
  status: string;
  courier?: string | null;
  tracking_number?: string | null;
  packing_task_id?: number | null;
}

export interface FulfillmentDetail {
  id: number;
  fulfillment_number: string;
  order_id: number;
  order: FulfillmentOrderRef | null;
  warehouse_id: number;
  warehouse: FulfillmentWarehouseRef | null;
  status: FulfillmentStatus;
  priority: FulfillmentPriority;
  assigned_to: number | null;
  assigned_user: { id: number; name: string } | null;
  items: FulfillmentItem[];
  picking_tasks: PickingTask[];
  packing_tasks: PackingTask[];
  packages: FulfillmentPackage[];
  shipments: FulfillmentShipment[];
  cancelled_by: number | null;
  cancel_source: string | null;
  notes: string | null;
  picking_started_at: string | null;
  picking_completed_at: string | null;
  packing_started_at: string | null;
  packing_completed_at: string | null;
  ready_to_ship_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

/**
 * Live-verified against the catch backend: the fulfillments index returns a
 * FLAT array in `data` (Laravel paginator NOT wrapped — `limit` is capped
 * at 1–100 server-side; filters: warehouse_id/order_id/status/assigned_to).
 */
export type FulfillmentsListResponse = ApiResponse<FulfillmentListItem[]>;

export type FulfillmentDetailResponse = ApiResponse<FulfillmentDetail>;

export interface ReleaseFulfillmentData {
  /** Single mode — omit in bulk (exactly one of the two fields is required). */
  order_id?: number;
  /** Bulk mode, 1–100 ids; unknown/refused ids land in `failed[]` with HTTP 200. */
  order_ids?: number[];
  /** Omit to let the backend resolve the DEFAULT warehouse. */
  warehouse_id?: number;
  /** Single mode only; ignored in bulk (server passes null). */
  idempotency_key?: string;
}

export interface ReleasedSlimRow {
  order_id: number;
  fulfillment_id: number;
  fulfillment_number: string;
  status: string;
  items_count: number | string;
}

export interface FailedReleaseRow {
  order_id: number;
  reason: string;
}

/** Bulk mode ALWAYS returns 200 — real outcomes live in released[]/failed[]. */
export interface BulkReleaseResponseData {
  released: ReleasedSlimRow[];
  failed: FailedReleaseRow[];
  summary: {
    total: number;
    released_count: number;
    failed_count: number;
  };
}

export type ReleaseResponse =
  | ApiResponse<FulfillmentDetail> // single mode — 201 fresh / 200 replay
  | ApiResponse<BulkReleaseResponseData>; // bulk mode — always 200

/** POST /admin/fulfillments/create-packing-tasks — station is omitted (wave-1
 * scope: tasks always created unassigned). 1–100 unique fulfillment ids. */
export interface BulkCreatePackingTasksData {
  fulfillment_ids: number[];
  packing_station_id?: number | null;
}

/** A row the engine allowed: fresh packing task created per fulfillment. */
export interface BulkPackingTaskCreatedRow {
  fulfillment_id: number;
  fulfillment_number: string | null;
  packing_task_id: number;
  status: string;
  packing_station_id: number | null;
}

/** Refusal/miss row — verbatim engine reason (or "Fulfillment #id not found"). */
export interface BulkPackingTaskFailedRow {
  fulfillment_id: number;
  fulfillment_number: string | null;
  reason: string;
}

/** Fault-tolerant bulk result — NEVER a non-200; failures live here. */
export interface BulkCreatePackingTasksResult {
  successful: BulkPackingTaskCreatedRow[];
  failed: BulkPackingTaskFailedRow[];
  summary: {
    total: number;
    success_count: number;
    failed_count: number;
  };
}

export type BulkCreatePackingTasksResponse = ApiResponse<BulkCreatePackingTasksResult>;

/** POST /admin/fulfillments/create-shipments — courier/method/notes apply to
 * EVERY created label (contract commonData); 1–100 unique fulfillment ids.
 * NO idempotency_key and NO per-label destination_address on the bulk path. */
export interface BulkCreateShipmentsData {
  fulfillment_ids: number[];
  courier?: string | null;
  shipping_method?: string | null;
  notes?: string | null;
}

export interface BulkShipmentCreatedRow {
  fulfillment_id: number;
  fulfillment_number: string | null;
  shipment_id: number;
  tracking_number: string | null;
  status: string;
  courier: string | null;
}

export interface BulkShipmentFailedRow {
  fulfillment_id: number;
  fulfillment_number: string | null;
  reason: string;
}

export interface BulkCreateShipmentsResult {
  successful: BulkShipmentCreatedRow[];
  failed: BulkShipmentFailedRow[];
  summary: {
    total: number;
    success_count: number;
    failed_count: number;
  };
}

export type BulkCreateShipmentsResponse = ApiResponse<BulkCreateShipmentsResult>;

/** DELETE-less commands (assign/create-tasks/complete-picking/cancel) return the bounded detail. */
export type FulfillmentDetailApiResponse = ApiResponse<FulfillmentDetail>;

export interface AssignFulfillmentData {
  user_id: number;
}

export interface AssignPlacementData {
  product_location_id: number;
}

export interface CreateShipmentData {
  courier?: string | null;
  shipping_method?: string | null;
  notes?: string | null;
  destination_address?: Record<string, unknown> | null;
  idempotency_key?: string;
}

export interface CancelFulfillmentData {
  reason: string;
}

export interface ShipmentDetail {
  id: number;
  uuid: string | null;
  order_id: number | null;
  fulfillment_id: number | null;
  packing_task_id: number | null;
  tracking_number: string | null;
  courier: string | null;
  status: string;
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
  created_at: string;
  updated_at: string;
}

export type ShipmentDetailResponse = ApiResponse<ShipmentDetail>;
