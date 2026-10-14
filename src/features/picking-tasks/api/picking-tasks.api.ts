import { axiosClient } from '@/shared/api';
import type { ApiErrorResponse } from '@/shared/api';
import type {
  ClaimTaskData,
  ConfirmPickData,
  FetchPickingTasksParams,
  PickingTaskDetailResponseData,
  PickingTasksListResponseData,
  ReallocateTaskData,
  RecordPickData,
  SkipTaskData,
} from '../types/picking-task.types';

export async function fetchPickingTasks({
  warehouseId,
  batchId,
  fulfillmentId,
  status,
  mine,
  limit = 100,
}: FetchPickingTasksParams = {}): Promise<PickingTasksListResponseData> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (warehouseId) params.append('warehouse_id', warehouseId.toString());
  if (batchId) params.append('batch_id', batchId.toString());
  if (fulfillmentId) params.append('fulfillment_id', fulfillmentId.toString());
  if (status) params.append('status', status);
  if (mine) params.append('mine', '1');

  const { data } = await axiosClient.get<PickingTasksListResponseData>(
    '/admin/picking-tasks?' + params.toString()
  );
  return data;
}

export async function fetchPickingTaskById(
  id: number
): Promise<PickingTaskDetailResponseData> {
  const { data } = await axiosClient.get<PickingTaskDetailResponseData>(
    '/admin/picking-tasks/' + id
  );
  return data;
}

/**
 * Claim → 200 with the fresh detail. Same-worker re-claim refreshes the
 * lease idempotently (also 200); contention is 409; terminal is 422 —
 * all relayed as-is via the axios error path.
 */
export async function claimPickingTask(
  id: number,
  payload: ClaimTaskData = {}
): Promise<PickingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PickingTaskDetailResponseData>(
    '/admin/picking-tasks/' + id + '/claim',
    payload
  );
  return data;
}

/** Claimant-owned release back to the pool (progress kept). */
export async function releasePickingClaim(
  id: number
): Promise<PickingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PickingTaskDetailResponseData>(
    '/admin/picking-tasks/' + id + '/release'
  );
  return data;
}

/**
 * Direct-entry batch pick — ADDITIVE, no idempotency flag; validated
 * quantity > 0 with a strictly-positive zod gate client-side.
 */
export async function recordPick(
  id: number,
  payload: RecordPickData
): Promise<PickingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PickingTaskDetailResponseData>(
    '/admin/picking-tasks/' + id + '/record-pick',
    payload
  );
  return data;
}

/** Scan-shaped confirm (location + product + quantity). */
export async function confirmPick(
  id: number,
  payload: ConfirmPickData
): Promise<PickingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PickingTaskDetailResponseData>(
    '/admin/picking-tasks/' + id + '/confirm',
    payload
  );
  return data;
}

export async function skipPickingTask(
  id: number,
  payload: SkipTaskData
): Promise<PickingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PickingTaskDetailResponseData>(
    '/admin/picking-tasks/' + id + '/skip',
    payload
  );
  return data;
}

export async function reallocatePickingTask(
  id: number,
  payload: ReallocateTaskData
): Promise<PickingTaskDetailResponseData> {
  const { data } = await axiosClient.post<PickingTaskDetailResponseData>(
    '/admin/picking-tasks/' + id + '/reallocate',
    payload
  );
  return data;
}

export type { ApiErrorResponse };
