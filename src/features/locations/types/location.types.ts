export type LocationStatus = 'active' | 'inactive';

/**
 * The eight placement types the backend validates (create rule
 * `nullable|in:receiving,storage,picking,packing,staging,quarantine,damaged,returns`).
 * Anything else 422s — verified live against catch (type `teleport` → 422).
 */
export const LOCATION_TYPES = [
  'receiving',
  'storage',
  'picking',
  'packing',
  'staging',
  'quarantine',
  'damaged',
  'returns',
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export interface WarehouseLocation {
  id: number;
  /**
   * Wire quirk (live-verified on catch): the resource returns warehouse_id as
   * a STRING ("2"), even though it is sent as an integer.
   */
  warehouse_id: string | number;
  parent_id: number | null;
  code: string;
  barcode: string | null;
  name: string;
  type: LocationType | null;
  /**
   * Live quirk: new bins are stored with status NULL (sent status is silently
   * dropped on create) — the lifecycle ONLY moves through the explicit
   * activate/deactivate commands.
   */
  status: LocationStatus | null;
  priority: number | null;
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
 * Live-verified against catch backend: the locations index returns a FLAT
 * array in `data` (no Laravel paginator wrapper — no page/search/sort keys,
 * `limit` is capped at 100 server-side, and a foreign `warehouse_id` filter
 * returns an empty page instead of an error).
 */
export type LocationsListResponse = ApiResponse<WarehouseLocation[]>;

export type LocationDetailResponse = ApiResponse<WarehouseLocation>;

export interface CreateLocationData {
  warehouse_id: number | string;
  code: string;
  name: string;
  parent_id?: number | null;
  barcode?: string | null;
  type?: LocationType | null;
  priority?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * The PUT endpoint accepts metadata ONLY — `warehouse_id` and `status` have no
 * validation rules and are silently dropped server-side (live-verified: a PUT
 * carrying both landed with warehouse_id untouched and status unchanged).
 * The warehouse is permanent (D-LOC-MOVE) and the lifecycle moves through
 * activate/deactivate commands.
 */
export interface UpdateLocationData {
  name: string;
  parent_id?: number | null;
  barcode?: string | null;
  type?: LocationType | null;
  priority?: number | null;
  metadata?: Record<string, unknown> | null;
}

/** DELETE /admin/locations/{id} returns {status, message, success} — no data key. */
export interface MessageResponse {
  status: number;
  message: string;
  success: boolean;
}
