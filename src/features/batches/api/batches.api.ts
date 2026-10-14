import { axiosClient } from '@/shared/api';
import type { ApiErrorResponse } from '@/shared/api';
import type {
  AssignBatchData,
  BatchCommandData,
  BatchDetailResponseData,
  BatchesListResponseData,
  CreateBatchData,
  FetchBatchesParams,
  NextTaskResponse,
  PendingFulfillmentsResponseData,
  RetrySkippedResponseData,
} from '../types/batch.types';

export async function fetchBatches({
  warehouseId,
  status,
  assignedTo,
  mine,
  limit = 100,
}: FetchBatchesParams = {}): Promise<BatchesListResponseData> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (warehouseId) params.append('warehouse_id', warehouseId.toString());
  if (status) params.append('status', status);
  if (assignedTo) params.append('assigned_to', assignedTo.toString());
  if (mine) params.append('mine', '1');

  const { data } = await axiosClient.get<BatchesListResponseData>(
    '/admin/batches?' + params.toString()
  );
  return data;
}

export async function fetchBatchById(id: number): Promise<BatchDetailResponseData> {
  const { data } = await axiosClient.get<BatchDetailResponseData>(
    '/admin/batches/' + id
  );
  return data;
}

/**
 * Lowest-sequence pending task, or the 200-without-data empty shape.
 * Discriminate with `hasNextTask()` — never treat the empty 200 as an error.
 */
export async function fetchBatchNextTask(id: number): Promise<NextTaskResponse> {
  const { data } = await axiosClient.get<NextTaskResponse>(
    '/admin/batches/' + id + '/next-task'
  );
  return data;
}

/** Pending fulfillments available for batch creation (default: limit 10). */
export async function fetchPendingFulfillments({
  warehouseId,
  limit = 100,
}: { warehouseId?: number; limit?: number } = {}): Promise<PendingFulfillmentsResponseData> {
  const params = new URLSearchParams();
  params.append('limit', (limit ?? 100).toString());
  if (warehouseId) params.append('warehouse_id', warehouseId.toString());

  const { data } = await axiosClient.get<PendingFulfillmentsResponseData>(
    '/admin/batches/pending-fulfillments?' + params.toString()
  );
  return data;
}

/**
 * Fresh creation → 201 with batch detail; completed-key replay → 200
 * with the SAME batch. Guard refusals (scope mix, zero pickable,
 * item_open_task…) arrive as 422 without an errors map.
 */
export async function createBatch(payload: CreateBatchData): Promise<BatchDetailResponseData> {
  const { data } = await axiosClient.post<BatchDetailResponseData>(
    '/admin/batches',
    payload
  );
  return data;
}

/**
 * 200 assignment; privileged takeover (reassign) also 200 with a
 * different message. Occupied-without-reassign → 409 already_assigned.
 */
export async function assignBatch(
  id: number,
  payload: AssignBatchData
): Promise<BatchDetailResponseData> {
  const { data } = await axiosClient.post<BatchDetailResponseData>(
    '/admin/batches/' + id + '/assign',
    payload
  );
  return data;
}

/** assigned → picking. Anything else → 422 start_status. */
export async function startBatch(id: number): Promise<BatchDetailResponseData> {
  const { data } = await axiosClient.post<BatchDetailResponseData>(
    '/admin/batches/' + id + '/start'
  );
  return data;
}

/**
 * Strict gate: completed batches no-op to 200, incomplete → 422
 * with picked/total counts. Use refreshBatchProgress for the probe.
 */
export async function completeBatch(id: number): Promise<BatchDetailResponseData> {
  const { data } = await axiosClient.post<BatchDetailResponseData>(
    '/admin/batches/' + id + '/complete'
  );
  return data;
}

/** Lenient probe — never refuses; auto-completes when ready. */
export async function refreshBatchProgress(id: number): Promise<BatchDetailResponseData> {
  const { data } = await axiosClient.post<BatchDetailResponseData>(
    '/admin/batches/' + id + '/refresh-progress'
  );
  return data;
}

/** Open tasks → skipped; picked work untouched. Terminal → 422. */
export async function cancelBatch(
  id: number,
  payload: BatchCommandData
): Promise<BatchDetailResponseData> {
  const { data } = await axiosClient.post<BatchDetailResponseData>(
    '/admin/batches/' + id + '/cancel',
    payload
  );
  return data;
}

/**
 * One replacement task per retryable skipped item. Empty array =
 * distinct "Nothing retryable" success. Repeat retry with an open
 * task → 409 retry_open_task (NOT a safe replay).
 */
export async function retrySkippedTasks(
  id: number,
  payload: BatchCommandData
): Promise<RetrySkippedResponseData> {
  const { data } = await axiosClient.post<RetrySkippedResponseData>(
    '/admin/batches/' + id + '/retry',
    payload
  );
  return data;
}

export type { ApiErrorResponse };
