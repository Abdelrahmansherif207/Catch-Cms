import { axiosClient } from '@/shared/api';
import type {
  ApiResponse,
  CreateLocationData,
  LocationDetailResponse,
  LocationsListResponse,
  MessageResponse,
  UpdateLocationData,
  WarehouseLocation,
} from '../types/location.types';

export interface FetchLocationsParams {
  limit?: number;
  /**
   * Optional warehouse filter — the BACKEND does the filtering (live-verified:
   * a global holder filtering by any warehouse id gets that warehouse's rows,
   * or an empty page for an unknown id; the anti-enumeration 404 belongs to
   * scoped holders only).
   */
  warehouseId?: number | string | null;
}

/**
 * LIVE CONTRACT (curl-verified on catch, 2026-10-13):
 * this family IGNORES JSON bodies — a POST with Content-Type application/json
 * and a valid object 422s with "all fields required", while the identical
 * fields sent as application/x-www-form-urlencoded return 201.
 * So create/update bodies are sent as URLSearchParams with an explicit
 * urlencoded Content-Type (Laravel's ConvertEmptyStringsToNull then treats
 * empty strings as nulls — which is how parent_id/barcode get cleared).
 *
 * Body-shaping subtleties (curl-verified):
 * - `priority` has NO nullable rule server-side: sending an empty string is
 *   converted to null by the framework middleware and then 422s
 *   ("The priority must be an integer.") — so a null priority is OMITTED,
 *   not sent empty.
 * - `parent_id`/`barcode`/`metadata` empty strings DO null cleanly and pass —
 *   sending them empty is what allows CLEARING a parent barcode/metadata on
 *   update (omitting would leave the field unchanged).
 */
const CLEARABLE_KEYS = new Set(['parent_id', 'barcode', 'metadata']);

function toFormBody(payload: Record<string, unknown>): URLSearchParams {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (value === null) {
      if (CLEARABLE_KEYS.has(key)) body.append(key, '');
      continue;
    }
    body.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  return body;
}

const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' } as const;

export async function fetchLocations(
  { limit = 100, warehouseId }: FetchLocationsParams = {}
): Promise<LocationsListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (warehouseId !== undefined && warehouseId !== null && warehouseId !== '') {
    params.set('warehouse_id', String(warehouseId));
  }
  const { data } = await axiosClient.get<LocationsListResponse>(
    `/admin/locations?${params.toString()}`
  );
  return data;
}

export async function fetchLocationById(
  id: number | string
): Promise<LocationDetailResponse> {
  const { data } = await axiosClient.get<LocationDetailResponse>(`/admin/locations/${id}`);
  return data;
}

export async function createLocation(
  payload: CreateLocationData
): Promise<ApiResponse<WarehouseLocation>> {
  const { data } = await axiosClient.post<ApiResponse<WarehouseLocation>>(
    '/admin/locations',
    toFormBody(payload as unknown as Record<string, unknown>),
    { headers: FORM_HEADERS }
  );
  return data;
}

export async function updateLocation(
  id: number | string,
  payload: UpdateLocationData
): Promise<ApiResponse<WarehouseLocation>> {
  const { data } = await axiosClient.put<ApiResponse<WarehouseLocation>>(
    `/admin/locations/${id}`,
    toFormBody(payload as unknown as Record<string, unknown>),
    { headers: FORM_HEADERS }
  );
  return data;
}

/**
 * HARD delete — unlike warehouses (soft archive), locations have no SoftDeletes
 * trait; the row and its placements are permanently removed. Response has NO
 * data key. Returns 200 on success; blocked guards (children / active stock /
 * open picking tasks) surface as verbatim 422 literals.
 */
export async function deleteLocation(id: number | string): Promise<MessageResponse> {
  const { data } = await axiosClient.delete<MessageResponse>(`/admin/locations/${id}`);
  return data;
}

export async function activateLocation(
  id: number | string
): Promise<ApiResponse<WarehouseLocation>> {
  const { data } = await axiosClient.post<ApiResponse<WarehouseLocation>>(
    `/admin/locations/${id}/activate`
  );
  return data;
}

export async function deactivateLocation(
  id: number | string
): Promise<ApiResponse<WarehouseLocation>> {
  const { data } = await axiosClient.post<ApiResponse<WarehouseLocation>>(
    `/admin/locations/${id}/deactivate`
  );
  return data;
}
