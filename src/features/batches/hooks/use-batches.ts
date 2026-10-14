import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchBatches,
  fetchBatchById,
  fetchBatchNextTask,
  fetchPendingFulfillments,
  createBatch,
  assignBatch,
  startBatch,
  completeBatch,
  refreshBatchProgress,
  cancelBatch,
  retrySkippedTasks,
} from '../api/batches.api';
import type {
  AssignBatchData,
  BatchCommandData,
  CreateBatchData,
  FetchBatchesParams,
} from '../types/batch.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.batches.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.batches.details() });
  queryClient.invalidateQueries({ queryKey: queryKeys.batches.pending() });
  // Batch writes move fulfillments and tasks too.
  queryClient.invalidateQueries({ queryKey: queryKeys.fulfillments.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.pickingTasks.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.pickingTasks.details() });
}

export function useBatches(params: FetchBatchesParams = {}) {
  return useQuery({
    queryKey: queryKeys.batches.list(params),
    queryFn: () => fetchBatches(params),
    staleTime: 15 * 1000,
  });
}

export function useBatch(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.batches.detail(id),
    queryFn: () => fetchBatchById(Number(id!)),
    enabled: id !== undefined && id !== null,
    staleTime: 15 * 1000,
  });
}

/**
 * Lowest-sequence pending task, or the 200-without-data empty shape.
 * `refetchInterval` polls while the batch is active so a second operator
 * picking in parallel visibly advances the "Next up" card.
 */
export function useBatchNextTask(
  id: number | string | undefined,
  { poll = false }: { poll?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.batches.nextTask(id),
    queryFn: () => fetchBatchNextTask(Number(id!)),
    enabled: id !== undefined && id !== null,
    staleTime: 10 * 1000,
    refetchInterval: poll ? 20 * 1000 : false,
  });
}

export function usePendingFulfillments(
  params: { warehouseId?: number; limit?: number } = {},
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.batches.pendingFulfillments(params),
    queryFn: () => fetchPendingFulfillments(params),
    enabled,
    staleTime: 15 * 1000,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: CreateBatchData) => createBatch(payload),
    onSuccess: (response) => {
      // 200 = completed-key replay of the SAME batch; 201 = fresh.
      if (response.status === 200) toast.info(t('batches.replayCreated'));
      else toast.success(t('batches.created'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('batches.createError'));
    },
  });
}

export function useAssignBatch() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AssignBatchData }) =>
      assignBatch(id, payload),
    onSuccess: () => {
      toast.success(t('batches.assigned'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      // 409 already_assigned surfaces verbatim with the "use Take over" hint.
      handleApiError(error, t('batches.assignError'));
    },
  });
}

export function useStartBatch() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => startBatch(id),
    onSuccess: () => {
      toast.success(t('batches.started'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('batches.startError'));
    },
  });
}

export function useCompleteBatch() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => completeBatch(id),
    onSuccess: () => {
      toast.success(t('batches.completed'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      // Strict gate: the 422 incomplete text carries picked/total counts —
      // shown verbatim so the operator sees exactly what's left.
      handleApiError(error, t('batches.completeError'));
    },
  });
}

export function useRefreshBatchProgress() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => refreshBatchProgress(id),
    onSuccess: () => {
      toast.success(t('batches.progressRefreshed'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('batches.refreshError'));
    },
  });
}

export function useCancelBatch() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BatchCommandData }) =>
      cancelBatch(id, payload),
    onSuccess: () => {
      toast.success(t('batches.cancelled'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('batches.cancelError'));
    },
  });
}

export function useRetrySkippedTasks() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BatchCommandData }) =>
      retrySkippedTasks(id, payload),
    onSuccess: (response) => {
      // Empty array = distinct "Nothing retryable" success, not an error.
      if (response.data.length === 0) toast.info(t('batches.nothingRetryable'));
      else
        toast.success(
          t('batches.retried', { count: response.data.length })
        );
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('batches.retryError'));
    },
  });
}
