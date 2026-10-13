import { axiosClient } from '@/shared/api';
import type {
  ApiResponse,
  CreateWarehouseData,
  MessageResponse,
  UpdateWarehouseData,
  Warehouse,
  WarehouseDetailResponse,
  WarehousesListResponse,
} from '../types/warehouse.types';

export interface FetchWarehousesParams {
  limit?: number;
}

export async function fetchWarehouses({
  limit = 100,
}: FetchWarehousesParams = {}): Promise<WarehousesListResponse> {
  const { data } = await axiosClient.get<WarehousesListResponse>(
    `/admin/warehouses?limit=${limit}`
  );
  return data;
}

export async function fetchWarehouseById(
  id: number | string
): Promise<WarehouseDetailResponse> {
  const { data } = await axiosClient.get<WarehouseDetailResponse>(
    `/admin/warehouses/${id}`
  );
  return data;
}

export async function createWarehouse(
  payload: CreateWarehouseData
): Promise<ApiResponse<Warehouse>> {
  const { data } = await axiosClient.post<ApiResponse<Warehouse>>(
    '/admin/warehouses',
    payload
  );
  return data;
}

export async function updateWarehouse(
  id: number | string,
  payload: UpdateWarehouseData
): Promise<ApiResponse<Warehouse>> {
  const { data } = await axiosClient.put<ApiResponse<Warehouse>>(
    `/admin/warehouses/${id}`,
    payload
  );
  return data;
}

/** Soft delete — the backend ARCHIVES the row; there is no restore endpoint. */
export async function archiveWarehouse(id: number | string): Promise<MessageResponse> {
  const { data } = await axiosClient.delete<MessageResponse>(`/admin/warehouses/${id}`);
  return data;
}

export async function activateWarehouse(
  id: number | string
): Promise<ApiResponse<Warehouse>> {
  const { data } = await axiosClient.post<ApiResponse<Warehouse>>(
    `/admin/warehouses/${id}/activate`
  );
  return data;
}

export async function deactivateWarehouse(
  id: number | string
): Promise<ApiResponse<Warehouse>> {
  const { data } = await axiosClient.post<ApiResponse<Warehouse>>(
    `/admin/warehouses/${id}/deactivate`
  );
  return data;
}

export async function setDefaultWarehouse(
  id: number | string
): Promise<ApiResponse<Warehouse>> {
  const { data } = await axiosClient.post<ApiResponse<Warehouse>>(
    `/admin/warehouses/${id}/set-default`
  );
  return data;
}
