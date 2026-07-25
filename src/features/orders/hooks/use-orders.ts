import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchOrders,
  fetchOrderById,
  deleteOrder,
  type FetchOrdersParams,
} from '../api/orders.api';
import { orderRoutes } from '../routes/order.routes';
import type { ApiErrorResponse } from '@/shared/api';

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
