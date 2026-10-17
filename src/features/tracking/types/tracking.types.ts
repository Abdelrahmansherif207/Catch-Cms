/**
 * Types for the admin order-tracking endpoints:
 *   GET  /admin/tracking/dashboard
 *   GET  /admin/tracking/orders
 *   GET  /admin/tracking/orders/{orderId}
 *   GET  /admin/tracking/requires-attention
 *   GET  /admin/orders/{orderId}/shipment                       (PLAIN shape)
 *   POST /admin/orders/{orderId}/shipment/update-status          (PLAIN shape)
 *   POST /admin/orders/{orderId}/cancel                          (ApiResponse shape)
 *
 * The four tracking GETs use the Marvel ApiResponse envelope
 * {status, message, success, data?}. The shipment show/update use the
 * PLAIN {success, message?, data} shape (no status key) — deliberate,
 * code-verified backend difference.
 */

export type TrackingPeriod = 'today' | 'week' | 'month' | 'year';

export type TrackingSortColumn = 'created_at' | 'updated_at' | 'total_price' | 'status' | 'id';

export interface TrackingOverview {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  revenue_by_currency: Record<string, number>;
}

/** created_at arrives as a HUMAN string ("2 hours ago"), not a timestamp. */
export interface TrackingRecentOrder {
  id: number;
  order_number: string;
  customer: string;
  status: string;
  total: number;
  created_at: string;
}

export interface TrackingPendingActions {
  needs_processing: number;
  needs_shipment: number;
  payment_verification: number;
}

export interface TrackingRevenue {
  total: number;
  average: number;
  count: number;
  by_currency: Record<string, number>;
  currencies: string[];
  mixed_currencies: boolean;
}

export interface TrackingDashboardData {
  overview: TrackingOverview;
  /** Only statuses PRESENT in range appear — absent statuses are missing keys. */
  status_breakdown: Record<string, number>;
  recent_orders: TrackingRecentOrder[];
  pending_actions: TrackingPendingActions;
  revenue: TrackingRevenue;
}

export interface TrackingDashboardResponse {
  status: number;
  message: string;
  success: boolean;
  data: TrackingDashboardData;
}

export interface TrackingAttentionAlert {
  type: string;
  priority: string;
  count: number;
  message: string;
  action: string | null;
  link: string | null;
}

export interface TrackingAttentionData {
  payment_pending: number;
  processing_delayed: number;
  payment_failed: number;
  payment_verification_stuck: number;
  total: number;
  alerts: TrackingAttentionAlert[];
}

export interface TrackingAttentionResponse {
  status: number;
  message: string;
  success: boolean;
  data: TrackingAttentionData;
}

/**
 * GET /admin/tracking/orders inputs — no server validation; unknown values
 * filter literally (possibly to zero rows). Multi-value params may be a
 * comma-joined string or an array; the API layer joins arrays with ','
 * (backend splits on ',' + trims, then alias-expands payment statuses).
 */
export interface FetchTrackingOrdersParams {
  page?: number;
  status?: string;
  payment_status?: string | string[];
  payment_method?: string | string[];
  /** Backend fallback alias — applied only when payment_method is absent. */
  payment_type?: string | string[];
  payment_gateway?: string;
  fulfillment_status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  /** Relative created_at upper bound via the backend duration parser
   * ('30d' | '3_days' | '2 days' | '1w' | '1m' | '1y' | plain int = days).
   * Unparsable values apply NO filter; wins over older_than_days/hours/months. */
  older_than?: string | number;
  /** Applied only when older_than is absent (server-side elseif chain). */
  older_than_days?: number;
  older_than_hours?: number;
  older_than_months?: number;
  /** Relative created_at lower bound; wins over within_days server-side. */
  newer_than?: string | number;
  /** Applied only when newer_than is absent. */
  within_days?: number;
  sort_by?: TrackingSortColumn;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

export interface TrackingOrderRow {
  id: number;
  order_number: string;
  status: string;
  payment_status: string | null;
  fulfillment_status: string | null;
  shipment_status: string | null;
  tracking_number: string | null;
  total_price: number;
  currency_code: string | null;
  name: string | null;
  user_email: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string } | null;
}

/** Laravel paginator subset the UI consumes. */
export interface TrackingOrdersPageData {
  current_page: number;
  data: TrackingOrderRow[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface TrackingOrdersResponse {
  status: number;
  message: string;
  success: boolean;
  data: TrackingOrdersPageData;
}

export interface TrackingTimelineActor {
  id: number;
  name: string;
  email: string;
}

export interface TrackingTimelineEntry {
  id: number;
  timestamp: string;
  timestamp_human: string;
  old_status: string | null;
  new_status: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  changed_by: TrackingTimelineActor | null;
  changed_by_type: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
}

export interface TrackingAnalytics {
  total_status_changes: number;
  time_to_complete: string | null;
  time_since_creation: string;
  time_in_current_status: string;
}

/** Five engine rules that gate the detail page's action buttons. */
export interface TrackingActionsAvailable {
  can_process: boolean;
  can_ship: boolean;
  can_cancel: boolean;
  can_refund: boolean;
  can_mark_delivered: boolean;
}

export interface TrackingOrderModel {
  id: number;
  order_number: string;
  status: string;
  order_status: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  shipment_status: string | null;
  tracking_number: string | null;
  courier_name: string | null;
  estimated_delivery_at: string | null;
  actual_delivery_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  total_price: number;
  currency_code: string | null;
  payment_method: string | null;
  payment_gateway: string | null;
  name: string | null;
  user_email: string | null;
  user_phone: string | null;
  notes: string | null;
  user: { id: number; name: string; email: string; phone_number: string | null } | null;
  order_items?: TrackingOrderItem[];
}

export interface TrackingOrderItem {
  id: number;
  product_name: string;
  product_sku: string | null;
  product_quantity: number;
  product_total_price: number;
  currency_code: string | null;
}

export interface TrackingDetailData {
  order: TrackingOrderModel;
  timeline: TrackingTimelineEntry[];
  analytics: TrackingAnalytics;
  actions_available: TrackingActionsAvailable;
}

export interface TrackingDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: TrackingDetailData;
}

export interface OrderShipmentData {
  order_id: number;
  shipment_status: string | null;
  tracking_number: string | null;
  courier_name: string | null;
  estimated_delivery_at: string | null;
  actual_delivery_at: string | null;
}

/** PLAIN shape — no status/message keys on success, no data on 404. */
export interface OrderShipmentResponse {
  success: boolean;
  message?: string;
  data?: OrderShipmentData;
}

export const SHIPMENT_UPDATE_STATUSES = [
  'pending',
  'label_created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_delivery',
  'returned',
  'cancelled',
] as const;

export type ShipmentUpdateStatus = (typeof SHIPMENT_UPDATE_STATUSES)[number];

export interface UpdateShipmentStatusData {
  status: ShipmentUpdateStatus;
  tracking_number?: string | null;
  courier_name?: string | null;
  location_data?: Record<string, unknown> | null;
  estimated_delivery_at?: string | null;
  notes?: string | null;
}

/** PLAIN shape; tracking_number may be the STALE pre-event echo — re-read via show. */
export interface UpdateShipmentStatusResponse {
  success: boolean;
  message: string;
  data: {
    order_id: number;
    shipment_status: string | null;
    tracking_number: string | null;
  };
}

export interface CancelledFulfillment {
  id: number;
  status: string;
}

export interface CancelOrderData {
  reason: string;
}

/** ApiResponse envelope; shipped/terminal fulfillments survive in the list. */
export interface CancelOrderResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    order_id: number;
    status: string;
    fulfillments: CancelledFulfillment[];
  };
}

export function isCancellable(actions: TrackingActionsAvailable): boolean {
  return actions.can_cancel;
}
