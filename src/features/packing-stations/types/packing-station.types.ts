export type PackingStationStatus = 'active' | 'inactive' | 'maintenance';

export interface PackingStation {
  id: number;
  warehouse_id: number;
  code: string;
  name: string;
  status: PackingStationStatus;
  assigned_to: number | null;
  daily_capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

/**
 * Live-verified against the catch backend: the packing-stations index
 * returns a FLAT array in `data` (Laravel paginator NOT wrapped — `limit`
 * is capped at 100 server-side with no floor; there are no page/search/sort
 * params, only `status` equality and `warehouse_id` filters).
 */
export type PackingStationsListResponse = ApiResponse<PackingStation[]>;

export type PackingStationDetailResponse = ApiResponse<PackingStation>;

export interface CreatePackingStationData {
  /** Omit to let the backend resolve the DEFAULT warehouse (422 if none usable). */
  warehouse_id?: number;
  code: string;
  name: string;
  status?: PackingStationStatus;
  assigned_to?: number | null;
  daily_capacity?: number | null;
}

/**
 * The PUT endpoint has NO `warehouse_id` rule — it is silently dropped
 * server-side (warehouse moves are impossible through this endpoint).
 */
export interface UpdatePackingStationData {
  code?: string;
  name?: string;
  status?: PackingStationStatus;
  assigned_to?: number | null;
  daily_capacity?: number | null;
}

/** DELETE /admin/packing-stations/{id} returns {status, message, success} — no data key. */
export interface MessageResponse {
  status: number;
  message: string;
  success: boolean;
}
