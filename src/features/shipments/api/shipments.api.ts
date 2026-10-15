import { axiosClient } from '@/shared/api';
import type {
  ShipmentDetailResponse,
  ShipmentListItem,
  ShipmentNotesData,
  CancelShipmentData,
  ShipmentDetail,
  ShipmentsListResponse,
  FetchShipmentsParams,
  BulkShipmentActionData,
  BulkShipmentActionResponse,
} from '../types/shipment.types';

/**
 * GET /admin/shipments — the shipments page. Called WITHOUT
 * fulfillment_id it asks for ALL shipments in scope (no filters yet);
 * with ?fulfillment_id it narrows to that fulfillment's labels. Optional
 * status filter + limit (cap 100), newest first. The data is a FLAT array
 * page — the flat envelope mirrors the picking/packing lists.
 * If a deployed backend still mandates fulfillment_id at validation, the
 * bare 422 relays as-is and lands in the page's error state (the picker is
 * always available).
 */
export async function fetchShipments({
  fulfillmentId,
  status,
  limit = 15,
}: FetchShipmentsParams): Promise<ShipmentsListResponse> {
  const params = new URLSearchParams();
  if (fulfillmentId !== undefined) {
    params.append('fulfillment_id', String(fulfillmentId));
  }
  if (limit) params.append('limit', String(limit));
  if (status) params.append('status', status);

  const { data } = await axiosClient.get<ShipmentsListResponse>(
    '/admin/shipments' + (params.toString() ? '?' + params.toString() : '')
  );
  return data;
}

/**
 * GET /admin/shipments/{id} — full 24-key detail. Order-only legacy labels
 * (null fulfillment_id) 404 fail-closed; cross-warehouse ids 404 too.
 */
export async function fetchShipmentById(id: number): Promise<ShipmentDetailResponse> {
  const { data } = await axiosClient.get<ShipmentDetailResponse>(
    '/admin/shipments/' + id
  );
  return data;
}

/**
 * Dispatch (label_created → picked_up, fulfillment → shipped): 200 fresh.
 * Duplicate dispatch is a verbatim 422 service refusal — relayed as-is.
 */
export async function dispatchShipment(
  id: number,
  payload: ShipmentNotesData = {}
): Promise<ShipmentDetailResponse> {
  const { data } = await axiosClient.post<ShipmentDetailResponse>(
    '/admin/shipments/' + id + '/dispatch',
    payload
  );
  return data;
}

/**
 * Deliver (walks picked_up → … → delivered; fulfillment → delivered):
 * 200 fresh AND on safe re-delivery replay. Pre-dispatch rows 422 verbatim.
 */
export async function deliverShipment(
  id: number,
  payload: ShipmentNotesData = {}
): Promise<ShipmentDetailResponse> {
  const { data } = await axiosClient.post<ShipmentDetailResponse>(
    '/admin/shipments/' + id + '/deliver',
    payload
  );
  return data;
}

/**
 * Cancel (audited, row retained, fulfillment never moves backward):
 * reason required (min 1), actor fields are server-derived. Terminal rows
 * and post-dispatch cancels 422 with verbatim engine text.
 */
export async function cancelShipment(
  id: number,
  payload: CancelShipmentData
): Promise<ShipmentDetailResponse> {
  const { data } = await axiosClient.post<ShipmentDetailResponse>(
    '/admin/shipments/' + id + '/cancel',
    payload
  );
  return data;
}

/**
 * Bulk dispatch — ALWAYS 200 fault-tolerant report (1–100 ids, shared
 * notes ≤500). Missing/duplicate rows land in failed[] verbatim.
 */
export async function bulkDispatchShipments(
  payload: BulkShipmentActionData
): Promise<BulkShipmentActionResponse> {
  const { data } = await axiosClient.post<BulkShipmentActionResponse>(
    '/admin/shipments/bulk-dispatch',
    payload
  );
  return data;
}

/**
 * Bulk deliver — same fault-tolerant shape; re-delivery counts successful,
 * pre-dispatch rows refuse per-item. notes ≤500 shared.
 */
export async function bulkDeliverShipments(
  payload: BulkShipmentActionData
): Promise<BulkShipmentActionResponse> {
  const { data } = await axiosClient.post<BulkShipmentActionResponse>(
    '/admin/shipments/bulk-deliver',
    payload
  );
  return data;
}

export type { ShipmentListItem, ShipmentDetail };
