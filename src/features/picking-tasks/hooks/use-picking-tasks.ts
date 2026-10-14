import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchPickingTasks,
  fetchPickingTaskById,
  claimPickingTask,
  releasePickingClaim,
  recordPick,
  confirmPick,
  skipPickingTask,
  reallocatePickingTask,
} from '../api/picking-tasks.api';
import type {
  ClaimTaskData,
  ConfirmPickData,
  FetchPickingTasksParams,
  ReallocateTaskData,
  RecordPickData,
  SkipTaskData,
} from '../types/picking-task.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.pickingTasks.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.pickingTasks.details() });
  // Task progress mirrors onto the fulfillment + its items.
  queryClient.invalidateQueries({ queryKey: queryKeys.fulfillments.all });
}

export function usePickingTasks(params: FetchPickingTasksParams = {}) {
  return useQuery({
    queryKey: queryKeys.pickingTasks.list(params),
    queryFn: () => fetchPickingTasks(params),
    staleTime: 15 * 1000,
  });
}

export function usePickingTask(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.pickingTasks.detail(id),
    queryFn: () => fetchPickingTaskById(Number(id!)),
    enabled: id !== undefined && id !== null,
    staleTime: 15 * 1000,
  });
}

export function useClaimPickingTask() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: ClaimTaskData }) =>
      claimPickingTask(id, payload),
    onSuccess: () => {
      toast.success(t('pickingTasks.claimed'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('pickingTasks.claimError'));
    },
  });
}

export function useReleasePickingClaim() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => releasePickingClaim(id),
    onSuccess: () => {
      toast.success(t('pickingTasks.claimReleased'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('pickingTasks.releaseError'));
    },
  });
}

export function useRecordPick() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RecordPickData }) =>
      recordPick(id, payload),
    onSuccess: () => {
      toast.success(t('pickingTasks.pickRecorded'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('pickingTasks.pickError'));
    },
  });
}

export function useConfirmPick() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ConfirmPickData }) =>
      confirmPick(id, payload),
    onSuccess: () => {
      toast.success(t('pickingTasks.pickConfirmed'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('pickingTasks.pickError'));
    },
  });
}

export function useSkipPickingTask() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SkipTaskData }) =>
      skipPickingTask(id, payload),
    onSuccess: () => {
      toast.success(t('pickingTasks.skipped'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('pickingTasks.skipError'));
    },
  });
}

export function useReallocatePickingTask() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReallocateTaskData }) =>
      reallocatePickingTask(id, payload),
    onSuccess: () => {
      toast.success(t('pickingTasks.reallocated'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      // Engine 422s (wrong product / inactive target / …) surface verbatim —
      // the server is the source of truth for placement validity.
      handleApiError(error, t('pickingTasks.reallocateError'));
    },
  });
}
