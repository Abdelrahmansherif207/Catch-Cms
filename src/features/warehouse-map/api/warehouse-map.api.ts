import { axiosClient } from '@/shared/api';
import {
  fetchPickingTaskById,
  fetchPickingTasks,
} from '@/features/picking-tasks/api/picking-tasks.api';
import type {
  CheckOccupancyResponse,
  OccupiedLocation,
  PickRoute,
  PickRouteStop,
} from '../types/warehouse-map.types';

/** Server-side list cap — also bounds the detail fan-out below. */
const MAX_ROUTE_TASKS = 100;

/**
 * Location ids per check-occupancy POST. The endpoint takes any array, but a
 * moderate chunk keeps payloads small and individual requests comfortably
 * under the admin throttle (400/min) so large bin indexes stay predictable.
 */
export const OCCUPANCY_CHUNK_SIZE = 50;

/** Merged occupancy across all chunked POSTs for one warehouse's bins. */
export interface BinOccupancyResult {
  occupied: OccupiedLocation[];
  /** Ids answered as empty (plain rows carry nothing the map needs). */
  emptyIds: number[];
  /** Requested ids that don't exist / are out of scope / mismatch warehouse_id. */
  notFoundIds: number[];
}

/**
 * LIVE CONTRACT (curl-verified on meem, 2026-10-20): this Wms route ACCEPTS
 * JSON bodies (unlike the CRUD locations endpoints — see locations.api.ts)
 * and is strictly read-only: no writes, no transactions. Occupied rule is
 * sum(quantity) > 0, with zero/zero placements filtered server-side.
 */
export async function fetchLocationOccupancy(
  locationIds: readonly number[],
  warehouseId?: number | null
): Promise<BinOccupancyResult> {
  const chunks: number[][] = [];
  for (let index = 0; index < locationIds.length; index += OCCUPANCY_CHUNK_SIZE) {
    chunks.push(locationIds.slice(index, index + OCCUPANCY_CHUNK_SIZE) as number[]);
  }

  const pages = await Promise.all(
    chunks.map((chunk) => {
      const body: { location_ids: number[]; warehouse_id?: number } = { location_ids: chunk };
      if (warehouseId != null) body.warehouse_id = warehouseId;
      return axiosClient
        .post<CheckOccupancyResponse>('/admin/locations/check-occupancy', body)
        .then((response) => response.data.data);
    })
  );

  const occupied: OccupiedLocation[] = [];
  const emptyIds: number[] = [];
  const notFoundIds: number[] = [];
  for (const page of pages) {
    occupied.push(...(page.occupied ?? []));
    for (const row of page.empty ?? []) emptyIds.push(row.id);
    notFoundIds.push(...(page.not_found ?? []));
  }

  return { occupied, emptyIds, notFoundIds };
}

/**
 * Builds the walking route for one picking batch.
 *
 * LIVE CONTRACT quirk (why the detail fan-out exists): the LIST rows carry
 * `product_location_id` — a product_locations row id, NOT the locations-table
 * id the map is keyed on — while each DETAIL embeds `location.location_id`
 * (the true bin id) plus its code. The list has no pagination (cap 100), so
 * batches larger than that are partially routed.
 */
export async function fetchPickRoute(batchId: number): Promise<PickRoute> {
  const list = await fetchPickingTasks({ batchId, limit: MAX_ROUTE_TASKS });
  const rows = list.data.slice(0, MAX_ROUTE_TASKS);
  const details = await Promise.all(rows.map((row) => fetchPickingTaskById(row.id)));

  const stops: PickRouteStop[] = rows.map((row, index) => {
    const detail = details[index]?.data;
    return {
      taskId: row.id,
      sequence: row.sequence ?? detail?.op_seq ?? row.id,
      orderId: row.order_id,
      quantityToPick: Number(row.quantity_to_pick) || 0,
      locationId: detail?.location?.location_id ?? null,
      locationCode: detail?.location?.code ?? null,
    };
  });

  stops.sort((a, b) => a.sequence - b.sequence || a.taskId - b.taskId);

  return {
    batchId,
    stops,
    unplacedCount: stops.filter((stop) => stop.locationId === null).length,
  };
}
