import { axiosClient } from '@/shared/api';
import type { ApiResponse, PaginatedResponse } from '@/features/orders/types/order.types';
import type {
  OrderFlow,
  OrderStatusCatalogItem,
  OrderFlowInput,
  CreateFlowPayload,
  UpdateFlowPayload,
  UpdateFlowStatusPayload,
  CreateFlowInputsPayload,
  UpdateFlowInputPayload,
  FlowListParams,
  StatusListParams,
} from '../types/order-flow.types';

function buildQuery(params: object) {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

// Order Flows (admin)
export async function fetchOrderFlows(
  params: FlowListParams = {}
): Promise<ApiResponse<PaginatedResponse<OrderFlow>>> {
  const { data } = await axiosClient.get(`/admin/order-flows${buildQuery(params)}`);
  return data;
}

export async function fetchOrderFlowById(id: number): Promise<ApiResponse<OrderFlow>> {
  const { data } = await axiosClient.get(`/admin/order-flows/${id}`);
  return data;
}

export async function createOrderFlow(payload: CreateFlowPayload): Promise<ApiResponse<OrderFlow>> {
  const { data } = await axiosClient.post('/admin/order-flows', payload);
  return data;
}

export async function updateOrderFlow(
  id: number,
  payload: UpdateFlowPayload
): Promise<ApiResponse<OrderFlow>> {
  const { data } = await axiosClient.put(`/admin/order-flows/${id}`, payload);
  return data;
}

// Status catalog (admin)
export async function fetchOrderStatuses(
  params: StatusListParams = {}
): Promise<ApiResponse<PaginatedResponse<OrderStatusCatalogItem>>> {
  const { data } = await axiosClient.get(`/admin/order-statuses${buildQuery(params)}`);
  return data;
}

export async function fetchOrderStatusById(id: number): Promise<ApiResponse<OrderStatusCatalogItem>> {
  const { data } = await axiosClient.get(`/admin/order-statuses/${id}`);
  return data;
}

export async function updateOrderStatusCatalog(
  id: number,
  payload: UpdateFlowStatusPayload
): Promise<ApiResponse<OrderStatusCatalogItem>> {
  const { data } = await axiosClient.put(`/admin/order-statuses/${id}`, payload);
  return data;
}

// Flow inputs (admin)
export async function fetchFlowInputs(
  flowId: number,
  params: { is_active?: boolean } = {}
): Promise<ApiResponse<OrderFlowInput[]>> {
  const { data } = await axiosClient.get(
    `/admin/order-flows/${flowId}/inputs${buildQuery(params)}`
  );
  return data;
}

export async function createFlowInputs(
  flowId: number,
  inputs: CreateFlowInputsPayload[]
): Promise<ApiResponse<OrderFlowInput[]>> {
  const { data } = await axiosClient.post(`/admin/order-flows/${flowId}/inputs`, { inputs });
  return data;
}

export async function updateFlowInput(
  inputId: number,
  payload: UpdateFlowInputPayload
): Promise<ApiResponse<OrderFlowInput>> {
  const { data } = await axiosClient.put(`/admin/order-flow-inputs/${inputId}`, payload);
  return data;
}

export async function deleteFlowInput(inputId: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete(`/admin/order-flow-inputs/${inputId}`);
  return data;
}
