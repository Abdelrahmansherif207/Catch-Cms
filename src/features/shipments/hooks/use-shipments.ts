import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchShipments,
  fetchShipmentById,
  dispatchShipment,
  deliverShipment,
  cancelShipment,
  bulkDispatchShipments,
  bulkDeliverShipments,
} from '../api/shipments.api';
import type {
  BulkShipmentActionData,
  CancelShipmentData,
  FetchShipmentsParams,
  ShipmentNotesData,
} from '../types/shipment.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
  // Shipment commands flip fulfillment statuses (shipped/delivered) and the
  // fulfillment detail embeds a shipments mini-table.
  queryClient.invalidateQueries({ queryKey: queryKeys.fulfillments.all });
}

export function useShipments(params: FetchShipmentsParams) {
  return useQuery({
    queryKey: queryKeys.shipments.fulfillments(
      params.fulfillmentId,
      params
    ),
    queryFn: () => fetchShipments(params),
    staleTime: 15 * 1000,
  });
}

export function useShipment(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.shipments.detail(id),
    queryFn: () => fetchShipmentById(Number(id!)),
    enabled: id !== undefined && id !== null,
    staleTime: 15 * 1000,
  });
}

export function useDispatchShipment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: ShipmentNotesData }) =>
      dispatchShipment(id, payload),
    onSuccess: () => {
      toast.success(t('shipments.dispatched'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('shipments.dispatchError'));
    },
  });
}

export function useDeliverShipment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: ShipmentNotesData }) =>
      deliverShipment(id, payload),
    onSuccess: () => {
      toast.success(t('shipments.delivered'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('shipments.deliverError'));
    },
  });
}

export function useCancelShipment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CancelShipmentData }) =>
      cancelShipment(id, payload),
    onSuccess: () => {
      toast.success(t('shipments.cancelled'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('shipments.cancelError'));
    },
  });
}

/**
 * Bulk dispatch/deliver — ALWAYS 200 with a summary; full success,
 * partial and all-failed toast phrasing mirror the fulfillment bullets.
 */
export function useBulkShipmentAction(
  kind: 'dispatch' | 'deliver'
) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: BulkShipmentActionData) =>
      kind === 'dispatch'
        ? bulkDispatchShipments(payload)
        : bulkDeliverShipments(payload),
    onSuccess: (response) => {
      const summary = response.data.summary;
      if (summary.success_count === 0) {
        toast.error(
          kind === 'dispatch'
            ? t('shipments.bulkDispatchAllFailed', { count: summary.failed_count })
            : t('shipments.bulkDeliverAllFailed', { count: summary.failed_count })
        );
      } else if (summary.failed_count === 0) {
        toast.success(
          kind === 'dispatch'
            ? t('shipments.bulkDispatchAllOk', { count: summary.success_count })
            : t('shipments.bulkDeliverAllOk', { count: summary.success_count })
        );
      } else {
        toast.warning(
          t('shipments.bulkPartial', { created: summary.success_count, failed: summary.failed_count })
        );
      }
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(
        error,
        kind === 'dispatch'
          ? t('shipments.bulkDispatchError')
          : t('shipments.bulkDeliverError')
      );
    },
  });
}
