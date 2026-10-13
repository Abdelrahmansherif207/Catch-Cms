export type WarehouseStatus = 'active' | 'inactive';

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  status: WarehouseStatus;
  is_default: boolean;
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
 * Live-verified against catch backend: the warehouses index returns a FLAT
 * array in `data` (no Laravel paginator wrapper — `limit` is capped at 100
 * server-side and there are no page/search/sort params).
 */
export type WarehousesListResponse = ApiResponse<Warehouse[]>;

export type WarehouseDetailResponse = ApiResponse<Warehouse>;

export interface CreateWarehouseData {
  code: string;
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  status?: WarehouseStatus;
  is_default?: boolean;
}

/**
 * The PUT endpoint accepts metadata ONLY — `code`, `status` and `is_default`
 * are silently dropped server-side; they move through their explicit
 * commands (activate/deactivate/set-default).
 */
export interface UpdateWarehouseData {
  name?: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

/** DELETE /admin/warehouses/{id} returns {status, message, success} — no data key. */
export interface MessageResponse {
  status: number;
  message: string;
  success: boolean;
}
