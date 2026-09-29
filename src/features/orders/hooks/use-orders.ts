import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchOrders,
  fetchOrderById,
  deleteOrder,
  updateOrderStatus,
  updateOrdersStatusBatch,
  fetchOrderStatusOptions,
  fetchAdminOrderStatuses,
  fetchMyOrders,
  type FetchOrdersParams,
} from '../api/orders.api';
import { orderRoutes } from '../routes/order.routes';
import type { ApiErrorResponse } from '@/shared/api';
import type { FlowValues, OrderStatus } from '../types/order.types';

function handleApiError(error: unknown, fallbackMessage: string) {
  const apiError = error as ApiErrorResponse;
  toast.error(apiError?.message || fallbackMessage);
}

export function useOrders(params: FetchOrdersParams = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => fetchOrders(params),
    staleTime: 60 * 1000,
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => fetchOrderById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useOrderStatusOptions(id: number) {
  return useQuery({
    queryKey: queryKeys.orders.statusOptions(id),
    queryFn: () => fetchOrderStatusOptions(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useAdminOrderStatuses(search?: string) {
  return useQuery({
    queryKey: queryKeys.orderStatuses.list({ search, is_active: true }),
    queryFn: () => fetchAdminOrderStatuses({ search, is_active: true }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: number) => deleteOrder(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Order deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      navigate(orderRoutes.list);
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete order');
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      flowValues,
    }: {
      id: number;
      status: OrderStatus;
      flowValues?: FlowValues;
    }) => updateOrderStatus(id, status, flowValues),
    onSuccess: (response, variables) => {
      toast.success(response.message || 'Order status updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.statusOptions(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update order status');
    },
  });
}

export function useUpdateOrdersStatusBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderIds,
      status,
      flowValues,
    }: {
      orderIds: number[];
      status: OrderStatus;
      flowValues?: FlowValues;
    }) => updateOrdersStatusBatch(orderIds, status, flowValues),
    onSuccess: (response) => {
      const succeeded = response.data?.summary?.succeeded ?? 0;
      const total = response.data?.summary?.total ?? 0;
      toast.success(`${succeeded} of ${total} orders updated`);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      const succeededIds =
        response.data?.results?.filter((r) => r.success).map((r) => r.order_id) ?? [];
      succeededIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.detail(id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.statusOptions(id),
        });
      });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update orders status');
    },
  });
}

export function useMyOrders(page = 1, limit = 15) {
  return useQuery({
    queryKey: queryKeys.orders.myOrders.list({ page, limit }),
    queryFn: () => fetchMyOrders(page, limit),
    staleTime: 60 * 1000,
  });
}
