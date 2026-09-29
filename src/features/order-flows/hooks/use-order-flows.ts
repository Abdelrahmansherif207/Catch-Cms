import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import { invalidateOrders } from '../lib/invalidate';
import {
  fetchOrderFlows,
  fetchOrderFlowById,
  createOrderFlow,
  updateOrderFlow,
  fetchOrderStatuses,
  fetchOrderStatusById,
  updateOrderStatusCatalog,
  fetchFlowInputs,
  createFlowInputs,
  updateFlowInput,
  deleteFlowInput,
} from '../api/order-flows.api';
import type {
  CreateFlowPayload,
  UpdateFlowPayload,
  CreateFlowInputsPayload,
  UpdateFlowInputPayload,
  UpdateFlowStatusPayload,
} from '../types/order-flow.types';
import type { FlowListParams, StatusListParams } from '../types/order-flow.types';

function handleApiError(error: unknown, fallbackMessage: string) {
  const apiError = error as { message?: string; errors?: unknown };
  toast.error(apiError?.message || fallbackMessage);
}

export function useOrderFlows(params: FlowListParams = {}) {
  return useQuery({
    queryKey: queryKeys.orderFlows.list(params),
    queryFn: () => fetchOrderFlows(params),
    staleTime: 60 * 1000,
  });
}

export function useOrderFlow(id: number) {
  return useQuery({
    queryKey: queryKeys.orderFlows.detail(id),
    queryFn: () => fetchOrderFlowById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateOrderFlow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFlowPayload) => createOrderFlow(payload),
    onSuccess: (response) => {
      toast.success(response.message || 'Order flow created');
      queryClient.invalidateQueries({ queryKey: queryKeys.orderFlows.lists() });
      invalidateOrders(queryClient);
    },
    onError: (error: unknown) => handleApiError(error, 'Failed to create order flow'),
  });
}

export function useUpdateOrderFlow(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFlowPayload) => updateOrderFlow(id, payload),
    onSuccess: (response) => {
      toast.success(response.message || 'Order flow updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.orderFlows.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orderFlows.lists() });
      invalidateOrders(queryClient);
    },
    onError: (error: unknown) => handleApiError(error, 'Failed to update order flow'),
  });
}

export function useOrderStatuses(params: StatusListParams = {}) {
  return useQuery({
    queryKey: queryKeys.orderStatuses.list(params),
    queryFn: () => fetchOrderStatuses(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrderStatus(id: number) {
  return useQuery({
    queryKey: queryKeys.orderStatuses.detail(id),
    queryFn: () => fetchOrderStatusById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateOrderStatusCatalog(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFlowStatusPayload) => updateOrderStatusCatalog(id, payload),
    onSuccess: (response) => {
      toast.success(response.message || 'Order status updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.orderStatuses.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orderStatuses.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orderFlows.all });
      invalidateOrders(queryClient);
    },
    onError: (error: unknown) => handleApiError(error, 'Failed to update order status'),
  });
}

export function useFlowInputs(flowId: number) {
  return useQuery({
    queryKey: queryKeys.orderFlows.inputs(flowId),
    queryFn: () => fetchFlowInputs(flowId),
    enabled: !!flowId,
    staleTime: 60 * 1000,
  });
}

export function useCreateFlowInputs(flowId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inputs: CreateFlowInputsPayload[]) => createFlowInputs(flowId, inputs),
    onSuccess: (response) => {
      toast.success(response.message || 'Flow inputs created');
      queryClient.invalidateQueries({ queryKey: queryKeys.orderFlows.inputs(flowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orderFlows.detail(flowId) });
      invalidateOrders(queryClient);
    },
    onError: (error: unknown) => handleApiError(error, 'Failed to create flow inputs'),
  });
}

export function useUpdateFlowInput(flowId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      inputId,
      payload,
    }: {
      inputId: number;
      payload: UpdateFlowInputPayload;
    }) => updateFlowInput(inputId, payload),
    onSuccess: (response) => {
      toast.success(response.message || 'Flow input updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.orderFlows.inputs(flowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orderFlows.detail(flowId) });
      invalidateOrders(queryClient);
    },
    onError: (error: unknown) => handleApiError(error, 'Failed to update flow input'),
  });
}

export function useDeleteFlowInput(flowId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inputId: number) => deleteFlowInput(inputId),
    onSuccess: (response) => {
      toast.success(response.message || 'Flow input deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.orderFlows.inputs(flowId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orderFlows.detail(flowId) });
      invalidateOrders(queryClient);
    },
    onError: (error: unknown) => handleApiError(error, 'Failed to delete flow input'),
  });
}
