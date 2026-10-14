import { axiosClient } from '@/shared/api';
import type { ApiErrorResponse } from '@/shared/api';
import type {
  AssignPackingTaskData,
  CancelPackingTaskData,
  CreatePackingTaskResponseData,
  FetchPackingTasksParams,
  PackPackingTaskData,
  PackingTaskDetailResponseData,
  PackingTasksListResponseData,
  VerifyPackingTaskData,
} from '../types/packing-task.types';

export async function fetchPackingTasks({
  warehouseId,
  stationId,
  fulfillmentId,
  status,
  assignedTo,
  limit = 100,
}: FetchPackingTasksParams = {}): Promise<PackingTasksListResponseData> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (warehouseId) params.append('warehouse_id', warehouseId.toString());
  if (stationId) params.append('station_id', stationId.toString());
  if (fulfillmentId) params.append('fulfillment_id', fulfillmentId.toString());
  if (status) params.append('status', status);
  if (assignedTo) params.append('assigned_to', assignedTo.toString());

  const { data } = await axiosClient.get<PackingTasksListResponseData>(
    '/admin/packing-tasks?' + params.toString()
  );
  return data;
}

export async function fetchPackingTaskById(
  id: number
): Promise<PackingTaskDetailResponseData> {
  const { data } = await axiosClient.get<PackingTaskDetailResponseData>(
    '/admin/packing-tasks/' + id
  );
  return data;
}

/**
 * Opens a packing task from a `picked` fulfillment (201; fulfillment flips
 * to `packing`). Idempotent-NO: a second open task 409s, wrong status 422s
 * with the live status text. Relay every error as-is via the axios path.
 */
export async function createPackingTaskForFulfillment(
  id: number
): Promise<CreatePackingTaskResponseData> {
  const { data } = await axiosClient.post<CreatePackingTaskResponseData>(
    '/admin/fulfillments/' + id + '/create-packing-task'
  );
  return data;
}

/**
 * Caller pinned as assignee — no user field. Same-user re-assign refreshes
 * (200); contention by another user is 409; terminal is 422; ghost station
 * surfaces as a framework-text 422 (no `exists` rule server-side).
 */
export async function assignPackingTask(
  id: number,
  payload: AssignPackingTaskData
): Promise<PackingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PackingTaskDetailResponseData>(
    '/admin/packing-tasks/' + id + '/assign',
    payload
  );
  return data;
}

/** No body — `assigned` → `packing`; restart attempts 422 with live status. */
export async function startPackingTask(
  id: number
): Promise<PackingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PackingTaskDetailResponseData>(
    '/admin/packing-tasks/' + id + '/start'
  );
  return data;
}

/**
 * `packing` → `packed`; locks weight/dimensions (double completion 422s
 * and the original data provably survives). Fulfillment stays `packing`.
 */
export async function packPackingTask(
  id: number,
  payload: PackPackingTaskData
): Promise<PackingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PackingTaskDetailResponseData>(
    '/admin/packing-tasks/' + id + '/pack',
    payload
  );
  return data;
}

/**
 * `packed` → `verified`; the fulfillment moves to `ready_to_ship`. Refused
 * until every picked unit sits in a non-voided package (live 422 text).
 */
export async function verifyPackingTask(
  id: number,
  payload: VerifyPackingTaskData
): Promise<PackingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PackingTaskDetailResponseData>(
    '/admin/packing-tasks/' + id + '/verify',
    payload
  );
  return data;
}

/** Non-completed tasks only — the row is retained with the reason in notes. */
export async function cancelPackingTask(
  id: number,
  payload: CancelPackingTaskData
): Promise<PackingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PackingTaskDetailResponseData>(
    '/admin/packing-tasks/' + id + '/cancel',
    payload
  );
  return data;
}

export type { ApiErrorResponse };
