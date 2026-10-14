import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchPackingTasks,
  fetchPackingTaskById,
  assignPackingTask,
  startPackingTask,
  packPackingTask,
  verifyPackingTask,
  cancelPackingTask,
} from '../api/packing-tasks.api';
import type {
  AssignPackingTaskData,
  CancelPackingTaskData,
  FetchPackingTasksParams,
  PackPackingTaskData,
  VerifyPackingTaskData,
} from '../types/packing-task.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.packingTasks.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.packingTasks.details() });
  // Task commands mirror onto the fulfillment (packing lifecycle stamps).
  queryClient.invalidateQueries({ queryKey: queryKeys.fulfillments.all });
}

export function usePackingTasks(params: FetchPackingTasksParams = {}) {
  return useQuery({
    queryKey: queryKeys.packingTasks.list(params),
    queryFn: () => fetchPackingTasks(params),
    staleTime: 15 * 1000,
  });
}

export function usePackingTask(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.packingTasks.detail(id),
    queryFn: () => fetchPackingTaskById(Number(id!)),
    enabled: id !== undefined && id !== null,
    staleTime: 15 * 1000,
  });
}

export function useAssignPackingTask() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AssignPackingTaskData }) =>
      assignPackingTask(id, payload),
    onSuccess: () => {
      toast.success(t('packingTasks.assigned'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      // 409 contention + 422 ghost-station/state texts surface verbatim —
      // the server wording is the operator's ground truth here.
      handleApiError(error, t('packingTasks.assignError'));
    },
  });
}

export function useStartPackingTask() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => startPackingTask(id),
    onSuccess: () => {
      toast.success(t('packingTasks.started'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('packingTasks.startError'));
    },
  });
}

export function usePackPackingTask() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PackPackingTaskData }) =>
      packPackingTask(id, payload),
    onSuccess: () => {
      toast.success(t('packingTasks.packed'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('packingTasks.packError'));
    },
  });
}

export function useVerifyPackingTask() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VerifyPackingTaskData }) =>
      verifyPackingTask(id, payload),
    onSuccess: () => {
      toast.success(t('packingTasks.verified'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      // Quantity/sibling 422s are the operator's checklist — show verbatim.
      handleApiError(error, t('packingTasks.verifyError'));
    },
  });
}

export function useCancelPackingTask() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CancelPackingTaskData }) =>
      cancelPackingTask(id, payload),
    onSuccess: () => {
      toast.success(t('packingTasks.cancelled'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('packingTasks.cancelError'));
    },
  });
}
