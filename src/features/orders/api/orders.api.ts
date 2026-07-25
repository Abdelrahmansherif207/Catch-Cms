import { axiosClient } from '@/shared/api';
import type { OrdersListResponse, OrderDetailResponse, ApiResponse } from '../types/order.types';

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
