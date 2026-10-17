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

/** `warehouse_users` pivot row, as returned with each assigned user. */
export interface WarehouseUserPivot {
  warehouse_id: number;
  user_id: number;
  is_primary: number | boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GET /admin/warehouses/{id}/users item — pivot list of staff users
 * (id, name, email, type + the `email_verified` model append).
 */
export interface WarehouseUser {
  id: number;
  name: string;
  email: string;
  type: string;
  email_verified?: boolean;
  pivot: WarehouseUserPivot;
}

export type WarehouseUsersResponse = ApiResponse<WarehouseUser[]>;

export type WarehouseAssignMode = 'attach' | 'sync' | 'detach';

export interface AssignWarehouseUsersData {
  user_ids: number[];
  mode?: WarehouseAssignMode;
}

/** POST summary echo: deduped ids + the applied mode. */
export interface AssignWarehouseUsersResult {
  warehouse_id: number;
  user_ids: number[];
  count: number;
  mode: string;
}

export type AssignWarehouseUsersResponse = ApiResponse<AssignWarehouseUsersResult>;

/**
 * DELETE /admin/warehouses/{id}/users/{userId} — same contract as the POST
 * summary (warehouse_id, user_ids, count, mode) with mode always "detach".
 * Idempotent: 200 + count 1 even when the user was not assigned (count counts
 * REQUESTED ids, never rows actually removed). No validation → no 422.
 */
export type RemoveWarehouseUserResponse = AssignWarehouseUsersResponse;
