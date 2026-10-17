import { axiosClient } from '@/shared/api';
import type {
  ApiResponse,
  AssignWarehouseUsersData,
  AssignWarehouseUsersResponse,
  CreateWarehouseData,
  MessageResponse,
  RemoveWarehouseUserResponse,
  UpdateWarehouseData,
  Warehouse,
  WarehouseDetailResponse,
  WarehouseUsersResponse,
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

/**
 * GET /admin/warehouses/{id}/users — pivot list of assigned staff users.
 * Cross-warehouse reads are masked as 404 (anti-enumeration, view-warehouse).
 */
export async function fetchWarehouseUsers(
  id: number | string
): Promise<WarehouseUsersResponse> {
  const { data } = await axiosClient.get<WarehouseUsersResponse>(
    `/admin/warehouses/${id}/users`
  );
  return data;
}

/**
 * POST /admin/warehouses/{id}/users — bulk pivot write (attach/sync/detach)
 * inside one transaction; requires manage-warehouse, cross-warehouse → 403.
 * attach = syncWithoutDetaching (idempotent), sync = replace, detach = remove.
 */
export async function assignWarehouseUsers(
  id: number | string,
  payload: AssignWarehouseUsersData
): Promise<AssignWarehouseUsersResponse> {
  const { data } = await axiosClient.post<AssignWarehouseUsersResponse>(
    `/admin/warehouses/${id}/users`,
    payload
  );
  return data;
}

/**
 * DELETE /admin/warehouses/{id}/users/{userId} — single-target unlink of the
 * `warehouse_users` pivot row; the user account itself is never deleted.
 * No body is read. Idempotent no-op: 200 + count 1 even if the user was not
 * assigned. Unknown warehouse/user → 404; foreign warehouse scope → 403.
 */
export async function removeWarehouseUser(
  id: number | string,
  userId: number | string
): Promise<RemoveWarehouseUserResponse> {
  const { data } = await axiosClient.delete<RemoveWarehouseUserResponse>(
    `/admin/warehouses/${id}/users/${userId}`
  );
  return data;
}
