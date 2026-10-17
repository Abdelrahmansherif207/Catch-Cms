import { axiosClient } from '@/shared/api';
import type {
  CancelOrderData,
  CancelOrderResponse,
  FetchTrackingOrdersParams,
  OrderShipmentResponse,
  TrackingAttentionResponse,
  TrackingDashboardResponse,
  TrackingDetailResponse,
  TrackingOrdersResponse,
  UpdateShipmentStatusData,
  UpdateShipmentStatusResponse,
} from '../types/tracking.types';

/**
 * Admin order-tracking API layer.
 *
 * All four tracking GETs require `view-orders` (in-method authorizeAdmin —
 * legacy type='admin' WITHOUT the permission is denied when the Spatie
 * system is available). No validation exists on any of them, so unknown
 * filter values filter literally and there is no 422 contract.
 */

/**
 * GET /admin/tracking/dashboard?period= — period is matched against
 * today/week/month/year; anything else silently behaves as today.
 */
export async function fetchTrackingDashboard(
  period: string
): Promise<TrackingDashboardResponse> {
  const { data } = await axiosClient.get<TrackingDashboardResponse>(
    '/admin/tracking/dashboard?period=' + encodeURIComponent(period)
  );
  return data;
}

/**
 * GET /admin/tracking/requires-attention — four all-time count probes plus
 * generated alerts; also feeds payment_verification in the dashboard cards.
 */
export async function fetchTrackingAttention(): Promise<TrackingAttentionResponse> {
  const { data } = await axiosClient.get<TrackingAttentionResponse>(
    '/admin/tracking/requires-attention'
  );
  return data;
}

/**
 * GET /admin/tracking/orders — Laravel paginator. per_page is server-clamped
 * 1–100; sort_by is whitelisted and anything else silently falls back to
 * created_at (desc unless sort_order=asc). Arrays are sent comma-joined
 * (backend splits on ',' + trims); payment_method wins over payment_type
 * (backend `??` fallback); relative-date params feed the duration parser.
 */
export async function fetchTrackingOrders(
  params: FetchTrackingOrdersParams
): Promise<TrackingOrdersResponse> {
  const search = new URLSearchParams();
  const append = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== null && value !== '') search.append(key, String(value));
  };
  const appendMulti = (key: string, value: string | string[] | undefined) => {
    if (value === undefined) return;
    const joined = Array.isArray(value) ? value.filter(Boolean).join(',') : value;
    append(key, joined);
  };

  append('page', params.page);
  append('status', params.status);
  appendMulti('payment_status', params.payment_status);
  appendMulti('payment_method', params.payment_method ?? params.payment_type);
  append('payment_gateway', params.payment_gateway);
  append('fulfillment_status', params.fulfillment_status);
  append('search', params.search);
  append('date_from', params.date_from);
  append('date_to', params.date_to);
  append('older_than', params.older_than);
  append('older_than_days', params.older_than_days);
  append('older_than_hours', params.older_than_hours);
  append('older_than_months', params.older_than_months);
  append('newer_than', params.newer_than);
  append('within_days', params.within_days);
  append('sort_by', params.sort_by);
  append('sort_order', params.sort_order);
  append('per_page', params.per_page);

  const qs = search.toString();
  const { data } = await axiosClient.get<TrackingOrdersResponse>(
    '/admin/tracking/orders' + (qs ? '?' + qs : '')
  );
  return data;
}

/**
 * GET /admin/tracking/orders/{orderId} — full tracking payload
 * {order, timeline, analytics, actions_available}. Unknown numeric ids
 * return a 404 IN the success envelope ({status:404, message, success:false},
 * no data) which the axios interceptor surfaces as an error.
 */
export async function fetchTrackingOrder(orderId: number): Promise<TrackingDetailResponse> {
  const { data } = await axiosClient.get<TrackingDetailResponse>(
    '/admin/tracking/orders/' + orderId
  );
  return data;
}

/**
 * GET /admin/orders/{orderId}/shipment — PLAIN shape ({success, data}, no
 * status/message keys). Unknown ids 404 translated ("Order not found.").
 */
export async function fetchOrderShipment(orderId: number): Promise<OrderShipmentResponse> {
  const { data } = await axiosClient.get<OrderShipmentResponse>(
    '/admin/orders/' + orderId + '/shipment'
  );
  return data;
}

/**
 * POST /admin/orders/{orderId}/shipment/update-status — fires ShipmentStatus-
 * Changed (always) + EstimatedDeliveryChanged (only on ETA change); the row
 * mutation happens in EVENT LISTENERS, so response's tracking_number may be
 * the STALE pre-event echo (order_id re-read is fresh). Unknown ids return
 * 500 "Failed to update shipment status" (not 404 — backend wart).
 */
export async function updateOrderShipmentStatus(
  orderId: number,
  payload: UpdateShipmentStatusData
): Promise<UpdateShipmentStatusResponse> {
  const { data } = await axiosClient.post<UpdateShipmentStatusResponse>(
    '/admin/orders/' + orderId + '/shipment/update-status',
    payload
  );
  return data;
}

/**
 * POST /admin/orders/{orderId}/cancel — Order Flow authority cancel with a
 * REQUIRED reason (BatchCommandRequest: min 1, max 2000). Refusals (sealed
 * custody, packed work, live shipment) come back as verbatim 422 engine
 * texts; unknown ids are Handler 404 "Resource Not Found". Use a disposable
 * order when testing — cancel cascades to open fulfillments.
 */
export async function cancelTrackingOrder(
  orderId: number,
  payload: CancelOrderData
): Promise<CancelOrderResponse> {
  const { data } = await axiosClient.post<CancelOrderResponse>(
    '/admin/orders/' + orderId + '/cancel',
    payload
  );
  return data;
}
