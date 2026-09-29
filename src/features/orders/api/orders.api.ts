import { axiosClient } from '@/shared/api';
import type {
  OrdersListResponse,
  OrderDetailResponse,
  MyOrdersListResponse,
  UpdateOrderStatusResponse,
  StatusOptionsResponse,
  BatchStatusResponse,
  FlowValues,
  ApiResponse,
  OrderStatus,
} from '../types/order.types';
import type { LocalizedName } from '@/shared/lib/localize';

export interface FetchOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  payment_status?: string;
  shipping_method?: string;
  created_from?: string;
  created_to?: string;
}

export async function fetchOrders({
  page = 1,
  limit = 15,
  search,
  status,
  payment_status,
  shipping_method,
  created_from,
  created_to,
}: FetchOrdersParams = {}): Promise<OrdersListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (payment_status) params.append('payment_status', payment_status);
  if (shipping_method) params.append('shipping_method', shipping_method);
  if (created_from) params.append('created_from', created_from);
  if (created_to) params.append('created_to', created_to);

  const { data } = await axiosClient.get<OrdersListResponse>(`/orders?${params.toString()}`);
  return data;
}

export async function fetchOrderById(id: number): Promise<OrderDetailResponse> {
  const { data } = await axiosClient.get<OrderDetailResponse>(`/orders/${id}`);
  return data;
}

export async function deleteOrder(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>(`/orders/${id}`);
  return data;
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
  flowValues?: FlowValues
): Promise<UpdateOrderStatusResponse> {
  const { data } = await axiosClient.patch<UpdateOrderStatusResponse>(
    `/orders/${id}/status`,
    { status, ...(flowValues ? { flow_values: flowValues } : {}) }
  );
  return data;
}

export async function updateOrdersStatusBatch(
  orderIds: number[],
  status: OrderStatus,
  flowValues?: FlowValues
): Promise<BatchStatusResponse> {
  const { data } = await axiosClient.patch<BatchStatusResponse>(`/orders/status`, {
    order_ids: orderIds,
    status,
    ...(flowValues ? { flow_values: flowValues } : {}),
  });
  return data;
}

export async function fetchOrderStatusOptions(id: number): Promise<StatusOptionsResponse> {
  const { data } = await axiosClient.get<StatusOptionsResponse>(`/orders/${id}/statuses`);
  return data;
}

export interface AdminOrderStatusItem {
  id: number;
  code: string;
  name: LocalizedName;
  is_active: boolean;
}

export async function fetchAdminOrderStatuses(params?: {
  search?: string;
  is_active?: boolean;
  per_page?: number;
}): Promise<ApiResponse<{ data: AdminOrderStatusItem[] }>> {
  const search = new URLSearchParams();
  if (params?.search) search.append('search', params.search);
  if (params?.is_active !== undefined) search.append('is_active', String(params.is_active));
  search.append('per_page', String(params?.per_page ?? 200));
  const { data } = await axiosClient.get(`/admin/order-statuses?${search.toString()}`);
  return data;
}

export async function fetchMyOrders(
  page = 1,
  limit = 15
): Promise<MyOrdersListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  const { data } = await axiosClient.get<MyOrdersListResponse>(
    `/general/orders?${params.toString()}`
  );
  return data;
}
