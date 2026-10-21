import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { fetchPickingTasks } from '@/features/picking-tasks/api/picking-tasks.api';
import {
  fetchLocationOccupancy,
  fetchPickRoute,
} from '../api/warehouse-map.api';

/**
 * Walking route for one picking batch — list + per-task detail fan-out
 * (see api/warehouse-map.api.ts for the product_location_id quirk).
 */
export function usePickRoute(batchId: number | null) {
  return useQuery({
    queryKey: queryKeys.warehouseMap.pickRoute(batchId ?? 0),
    queryFn: () => fetchPickRoute(batchId!),
    enabled: batchId !== null,
    staleTime: 30 * 1000,
  });
}

/**
 * Picking tasks of one warehouse (cap 100, no pagination server-side) —
 * enabled only for viewers that hold the picking permission, so users
 * without it never trigger the request.
 */
export function useWarehousePickingTasks(warehouseId: number | null, enabled: boolean) {
  const params = { warehouseId: warehouseId ?? undefined, limit: 100 };
  return useQuery({
    queryKey: queryKeys.pickingTasks.list(params),
    queryFn: () => fetchPickingTasks(params),
    enabled: enabled && warehouseId !== null,
    staleTime: 60 * 1000,
  });
}

/**
 * Which bins of the warehouse are empty vs occupied, with the products
 * stored in each — the check-occupancy POST is chunked (≤50 ids per call)
 * and spread across a read-only batch. The ids stay in the query key so a
 * bins-list refetch (bin created/removed/scope switch) re-checks fresh ids.
 */
export function useBinContents(
  warehouseId: number,
  locationIds: number[],
  enabled: boolean
) {
  return useQuery({
    queryKey: [...queryKeys.warehouseMap.binContents(warehouseId), locationIds],
    queryFn: () => fetchLocationOccupancy(locationIds, warehouseId),
    enabled: enabled && locationIds.length > 0,
    staleTime: 60 * 1000,
  });
}
