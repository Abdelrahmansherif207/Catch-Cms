import { axiosClient } from '@/shared/api';
import type {
  ApiResponse,
  CreatePackingStationData,
  MessageResponse,
  PackingStation,
  PackingStationDetailResponse,
  PackingStationsListResponse,
  PackingStationStatus,
  UpdatePackingStationData,
} from '../types/packing-station.types';

export interface FetchPackingStationsParams {
  /** Equality filter — `active`, `inactive` or `maintenance`. */
  status?: PackingStationStatus;
  /** Scoped callers: home-warehouse only (foreign filter → 404). */
  warehouseId?: number;
  /** Server cap 1–100 */
  limit?: number;
}

export async function fetchPackingStations({
  status,
  warehouseId,
  limit = 100,
}: FetchPackingStationsParams = {}): Promise<PackingStationsListResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (warehouseId) params.append('warehouse_id', warehouseId.toString());
  if (status) params.append('status', status);

  const { data } = await axiosClient.get<PackingStationsListResponse>(
    '/admin/packing-stations?' + params.toString()
  );
  return data;
}

export async function fetchPackingStationById(id: number): Promise<PackingStationDetailResponse> {
  const { data } = await axiosClient.get<PackingStationDetailResponse>(
    '/admin/packing-stations/' + id
  );
  return data;
}

export async function createPackingStation(
  payload: CreatePackingStationData
): Promise<ApiResponse<PackingStation>> {
  const { data } = await axiosClient.post<ApiResponse<PackingStation>>(
    '/admin/packing-stations',
    payload
  );
  return data;
}

export async function updatePackingStation(
  id: number,
  payload: UpdatePackingStationData
): Promise<ApiResponse<PackingStation>> {
  const { data } = await axiosClient.put<ApiResponse<PackingStation>>(
    '/admin/packing-stations/' + id,
    payload
  );
  return data;
}

/** Hard delete — the backend blocks the request with 422 when live packing tasks exist. */
export async function deletePackingStation(id: number): Promise<MessageResponse> {
  const { data } = await axiosClient.delete<MessageResponse>('/admin/packing-stations/' + id);
  return data;
}
