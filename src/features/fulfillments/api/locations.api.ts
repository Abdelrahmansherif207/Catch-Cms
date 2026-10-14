import { axiosClient } from '@/shared/api';

export interface WarehouseLocation {
  id: number;
  warehouse_id: number;
  parent_id: number | null;
  code: string;
  barcode: string | null;
  name: string;
  type: string;
  status: 'active' | 'inactive' | string;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface ApiEnvelope<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export type LocationsListResponse = ApiEnvelope<WarehouseLocation[]>;

/**
 * Physical warehouse locations (`/admin/locations`) — flat array,
 * live-verified. Currently hosted here because the only consumer is the
 * assign-placement picker; extract to a Locations feature if more appear.
 */
export async function fetchLocations({
  limit = 100,
}: { limit?: number } = {}): Promise<LocationsListResponse> {
  const { data } = await axiosClient.get<LocationsListResponse>(
    '/admin/locations?limit=' + limit
  );
  return data;
}
