import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchFulfillments,
  fetchFulfillmentById,
  releaseFulfillments,
  assignFulfillment,
  assignItemPlacement,
  bulkCreatePackingTasks,
  bulkCreateShipments,
  createPackingTaskForFulfillment,
  createPickingTasks,
  completePicking,
  cancelFulfillment,
  createShipment,
  type FetchFulfillmentsParams,
  isBulkReleaseResponse,
} from '../api/fulfillments.api';
import type {
  AssignFulfillmentData,
  AssignPlacementData,
  BulkCreatePackingTasksData,
  BulkCreateShipmentsData,
  BulkReleaseResponseData,
  CancelFulfillmentData,
  CreateShipmentData,
  FulfillmentItem,
  ReleaseFulfillmentData,
} from '../types/fulfillment.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.fulfillments.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.fulfillments.details() });
}

function invalidatePackingTasks(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.packingTasks.all });
}

export function useFulfillments(params: FetchFulfillmentsParams = {}) {
  return useQuery({
    queryKey: queryKeys.fulfillments.list(params),
    queryFn: () => fetchFulfillments(params),
    staleTime: 60 * 1000,
  });
}

export function useFulfillment(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.fulfillments.detail(id),
    queryFn: () => fetchFulfillmentById(Number(id!)),
    enabled: id !== undefined && id !== null,
    staleTime: 30 * 1000,
  });
}

export function useReleaseFulfillments() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: ReleaseFulfillmentData) => releaseFulfillments(payload),
    onSuccess: (response) => {
      if (isBulkReleaseResponse(response)) {
        const summary = (response.data as BulkReleaseResponseData).summary;
        if (summary.failed_count === 0) {
          toast.success(t('fulfillments.bulkReleasedAll', { count: summary.released_count }));
        } else {
          toast.warning(
            t('fulfillments.bulkReleasedPartial', {
              released: summary.released_count,
              failed: summary.failed_count,
            })
          );
        }
      } else {
        // Single mode — 201 fresh; 200 replay means it was already released.
        if (response.status === 200) toast.info(t('fulfillments.replayReleased'));
        else toast.success(t('fulfillments.released'));
      }
      invalidateAll(queryClient);
      // Released orders change shape on the orders board too.
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
    onError: (error) => {
      handleApiError(error, t('fulfillments.releaseError'));
    },
  });
}

/**
 * Bulk create packing tasks — the bulk path is ALWAYS 200 with a
 * report inside `data`; per-item failures never reject. Toast mirrors
 * the bulk-release phrasing (full success vs partial), and both the
 * fulfillments cache and the packing-task queue are invalidated since
 * the engine flipped statuses on the successful rows.
 */
export function useBulkCreatePackingTasks() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: BulkCreatePackingTasksData) => bulkCreatePackingTasks(payload),
    onSuccess: (response) => {
      const summary = response.data.summary;
      if (summary.success_count === 0) {
        toast.error(t('fulfillments.bulkPackingAllFailed', { count: summary.failed_count }));
      } else if (summary.failed_count === 0) {
        toast.success(t('fulfillments.bulkPackingAllCreated', { count: summary.success_count }));
      } else {
        toast.warning(
          t('fulfillments.bulkPackingPartial', {
            created: summary.success_count,
            failed: summary.failed_count,
          })
        );
      }
      invalidateAll(queryClient);
      invalidatePackingTasks(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('fulfillments.bulkPackingError'));
    },
  });
}

/**
 * Bulk create shipment labels — same fault-tolerant shape as bulk packing
 * (always 200, report in data). Invalidates fulfillments + shipments caches
 * because ready_to_ship rows gained labels and gained active-shipment locks.
 */
export function useBulkCreateShipments() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: BulkCreateShipmentsData) => bulkCreateShipments(payload),
    onSuccess: (response) => {
      const summary = response.data.summary;
      if (summary.success_count === 0) {
        toast.error(t('fulfillments.bulkShipAllFailed', { count: summary.failed_count }));
      } else if (summary.failed_count === 0) {
        toast.success(t('fulfillments.bulkShipAllCreated', { count: summary.success_count }));
      } else {
        toast.warning(
          t('fulfillments.bulkShipPartial', {
            created: summary.success_count,
            failed: summary.failed_count,
          })
        );
      }
      invalidateAll(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
    },
    onError: (error) => {
      handleApiError(error, t('fulfillments.bulkShipError'));
    },
  });
}

export function useAssignFulfillment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AssignFulfillmentData }) =>
      assignFulfillment(id, payload),
    onSuccess: () => {
      toast.success(t('fulfillments.assigned'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('fulfillments.assignError'));
    },
  });
}

export function useAssignItemPlacement(onDone?: () => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: AssignPlacementData }) =>
      assignItemPlacement(itemId, payload),
    onSuccess: () => {
      toast.success(t('fulfillments.placementAssigned'));
      queryClient.invalidateQueries({ queryKey: queryKeys.fulfillments.details() });
      onDone?.();
    },
    onError: (error) => {
      handleApiError(error, t('fulfillments.placementError'));
    },
  });
}

/** create-tasks always returns 200 (fresh, replay or empty set). */
export function useCreatePickingTasks() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => createPickingTasks(id),
    onSuccess: () => {
      toast.success(t('fulfillments.tasksReady'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('fulfillments.tasksError'));
    },
  });
}

/**
 * create-packing-task: 201 fresh (NOT idempotent — a second open task
 * 409s with the live conflict text, wrong-status 422s naming the status).
 * Packing tasks mirror onto both the fulfillments and packingTasks caches.
 */
export function useCreatePackingTask() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => createPackingTaskForFulfillment(id),
    onSuccess: () => {
      toast.success(t('fulfillments.packingTaskStarted'));
      invalidateAll(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.packingTasks.all });
    },
    onError: (error) => {
      handleApiError(error, t('fulfillments.packingTaskError'));
    },
  });
}

export function useCompletePicking() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => completePicking(id),
    onSuccess: () => {
      toast.success(t('fulfillments.pickingCompleted'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('fulfillments.pickingError'));
    },
  });
}

export function useCancelFulfillment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CancelFulfillmentData }) =>
      cancelFulfillment(id, payload),
    onSuccess: () => {
      toast.success(t('fulfillments.cancelled'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('fulfillments.cancelError'));
    },
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateShipmentData }) =>
      createShipment(id, payload),
    onSuccess: (response, variables) => {
      // 200 keyed replay vs 201 fresh — mirror the backend wording.
      if (response.status === 200) toast.info(t('fulfillments.shipmentReplay'));
      else toast.success(t('fulfillments.shipmentCreated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.fulfillments.detail(variables.id) });
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('fulfillments.shipmentError'));
    },
  });
}

export type { FulfillmentItem };
