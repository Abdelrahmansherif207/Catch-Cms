import { axiosClient } from '@/shared/api';
import type {
  ApiErrorResponse,
} from '@/shared/api';
import type {
  ApiResponse,
  AssignFulfillmentData,
  AssignPlacementData,
  BulkReleaseResponseData,
  CancelFulfillmentData,
  CreateShipmentData,
  FulfillmentDetail,
  FulfillmentDetailResponse,
  FulfillmentStatus,
  FulfillmentsListResponse,
  ReleaseFulfillmentData,
  ReleaseResponse,
  ShipmentDetailResponse,
} from '../types/fulfillment.types';

export interface FetchFulfillmentsParams {
  /** Equality filter — one of the closed 8-state set. */
  status?: FulfillmentStatus;
  /** Scoped callers: home-warehouse only (foreign filter → 404). */
  warehouseId?: number;
  orderId?: number;
  assignedTo?: number;
  /** Server cap 1–100 */
  limit?: number;
}

export async function fetchFulfillments({
  status,
  warehouseId,
  orderId,
  assignedTo,
  limit = 100,
}: FetchFulfillmentsParams = {}): Promise<FulfillmentsListResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (warehouseId) params.append('warehouse_id', warehouseId.toString());
  if (orderId) params.append('order_id', orderId.toString());
  if (assignedTo) params.append('assigned_to', assignedTo.toString());
  if (status) params.append('status', status);

  const { data } = await axiosClient.get<FulfillmentsListResponse>(
    '/admin/fulfillments?' + params.toString()
  );
  return data;
}

export async function fetchFulfillmentById(id: number): Promise<FulfillmentDetailResponse> {
  const { data } = await axiosClient.get<FulfillmentDetailResponse>(
    '/admin/fulfillments/' + id
  );
  return data;
}

/**
 * Single mode (`order_id`) → 201 fresh / 200 replay with the bounded detail.
 * Bulk mode (`order_ids`) → ALWAYS 200 with released[]/failed[]/summary.
 * The two response shapes are discriminated by presence of `released`
 * inside `data` (see isBulkReleaseResponse).
 */
export async function releaseFulfillments(
  payload: ReleaseFulfillmentData
): Promise<ReleaseResponse> {
  const { data } = await axiosClient.post<ReleaseResponse>(
    '/admin/fulfillments/release',
    payload
  );
  return data;
}

export async function assignFulfillment(
  id: number,
  payload: AssignFulfillmentData
): Promise<FulfillmentDetailResponse> {
  const { data } = await axiosClient.post<FulfillmentDetailResponse>(
    '/admin/fulfillments/' + id + '/assign',
    payload
  );
  return data;
}

export async function assignItemPlacement(
  itemId: number,
  payload: AssignPlacementData
): Promise<ApiResponse<FulfillmentDetail['items'][number]>> {
  const { data } = await axiosClient.post<
    ApiResponse<FulfillmentDetail['items'][number]>
  >('/admin/fulfillment-items/' + itemId + '/assign-placement', payload);
  return data;
}

/** Idempotent — frozen, replay, and empty-task outcomes all return 200. */
export async function createPickingTasks(id: number): Promise<ApiResponse<unknown[]>> {
  const { data } = await axiosClient.post<ApiResponse<unknown[]>>(
    '/admin/fulfillments/' + id + '/create-tasks'
  );
  return data;
}

export async function completePicking(id: number): Promise<FulfillmentDetailResponse> {
  const { data } = await axiosClient.post<FulfillmentDetailResponse>(
    '/admin/fulfillments/' + id + '/complete-picking'
  );
  return data;
}

export async function cancelFulfillment(
  id: number,
  payload: CancelFulfillmentData
): Promise<FulfillmentDetailResponse> {
  const { data } = await axiosClient.post<FulfillmentDetailResponse>(
    '/admin/fulfillments/' + id + '/cancel',
    payload
  );
  return data;
}

/** 201 fresh / 200 keyed replay; unkeyed duplicate → 409 (relayed as-is). */
export async function createShipment(
  fulfillmentId: number,
  payload: CreateShipmentData
): Promise<ShipmentDetailResponse> {
  const { data } = await axiosClient.post<ShipmentDetailResponse>(
    '/admin/fulfillments/' + fulfillmentId + '/shipments',
    payload
  );
  return data;
}

export function isBulkReleaseResponse(
  response: ReleaseResponse
): response is ApiResponse<BulkReleaseResponseData> {
  return (
    response.data !== null &&
    typeof response.data === 'object' &&
    'released' in response.data
  );
}

export type { ApiErrorResponse };
