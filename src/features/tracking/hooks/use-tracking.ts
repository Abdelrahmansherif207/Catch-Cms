import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  cancelTrackingOrder,
  fetchOrderShipment,
  fetchTrackingAttention,
  fetchTrackingDashboard,
  fetchTrackingOrder,
  fetchTrackingOrders,
  updateOrderShipmentStatus,
} from '../api/tracking.api';
import type {
  CancelOrderData,
  FetchTrackingOrdersParams,
  UpdateShipmentStatusData,
} from '../types/tracking.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useTrackingDashboard(period: string) {
  return useQuery({
    queryKey: queryKeys.tracking.dashboard(period),
    queryFn: () => fetchTrackingDashboard(period),
    staleTime: 30 * 1000,
  });
}

/**
 * Pollable attention feed — the dashboard banner passes refetchInterval
 * (60s) to keep the alert bar fresh while the page stays open.
 */
export function useTrackingAttention(refetchInterval?: number) {
  return useQuery({
    queryKey: queryKeys.tracking.attention(),
    queryFn: () => fetchTrackingAttention(),
    staleTime: 30 * 1000,
    refetchInterval,
  });
}

export function useTrackingOrders(params: FetchTrackingOrdersParams) {
  return useQuery({
    queryKey: queryKeys.tracking.orders(params),
    queryFn: () => fetchTrackingOrders(params),
    placeholderData: keepPreviousData,
    staleTime: 15 * 1000,
  });
}

export function useTrackingOrder(orderId: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.tracking.detail(orderId),
    queryFn: () => fetchTrackingOrder(Number(orderId!)),
    enabled: orderId !== undefined && orderId !== null,
    staleTime: 15 * 1000,
  });
}

/**
 * Order-level shipment read — PLAIN shape. Unknown ids 404 translated;
 * the hook leaves that to the page's error state like any other query.
 */
export function useOrderShipment(orderId: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.tracking.shipment(orderId),
    queryFn: () => fetchOrderShipment(Number(orderId!)),
    enabled: orderId !== undefined && orderId !== null,
    staleTime: 15 * 1000,
  });
}

/**
 * Shipment transition — invalidates the tracking cluster (detail, shipment
 * read, lists, dashboard, attention) because the detail page re-reads both
 * the order timeline and the shipment panel after a transition.
 */
export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: UpdateShipmentStatusData }) =>
      updateOrderShipmentStatus(orderId, payload),
    onSuccess: (_response, variables) => {
      toast.success(t('orders.shipmentUpdated'));
      invalidateTracking(queryClient, variables.orderId);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error) => {
      handleApiError(error, t('orders.shipmentUpdateError'));
    },
  });
}

/**
 * Order cancel — the destructive Order Flow command. Needs
 * order.cancel-during-fulfillment (route middleware) on top of view-orders;
 * 403s (missing permission, warehouse-scope) surface verbatim from the hook.
 */
export function useCancelTrackingOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: CancelOrderData }) =>
      cancelTrackingOrder(orderId, payload),
    onSuccess: (_response, variables) => {
      toast.success(t('orders.orderCancelled'));
      invalidateTracking(queryClient, variables.orderId);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (error) => {
      handleApiError(error, t('orders.cancelError'));
    },
  });
}

function invalidateTracking(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: number
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.tracking.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.tracking.detail(orderId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.tracking.shipment(orderId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.fulfillments.all });
}
