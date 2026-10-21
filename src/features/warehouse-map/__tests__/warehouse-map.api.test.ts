import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiResponse } from '@/test/mocks';
import type {
  PickingTaskDetail,
  PickingTaskListItem,
} from '@/features/picking-tasks/types/picking-task.types';
import type {
  CheckOccupancyData,
  OccupancyProduct,
  OccupiedLocation,
} from '../types/warehouse-map.types';

// No HTTP — the axios client is replaced; URL routing emulates the three
// endpoints these builders compose (task list + details, occupancy POST).
vi.mock('@/shared/api', () => ({
  axiosClient: { get: vi.fn(), post: vi.fn() },
}));

import { axiosClient } from '@/shared/api';
import { fetchLocationOccupancy, fetchPickRoute } from '../api/warehouse-map.api';

const mockedGet = vi.mocked(axiosClient.get);
const mockedPost = vi.mocked(axiosClient.post);

function listRow(overrides: Partial<PickingTaskListItem> & { id: number }): PickingTaskListItem {
  return {
    batch_id: 7,
    fulfillment_item_id: 100 + overrides.id,
    order_id: 500 + overrides.id,
    product_location_id: null,
    quantity_to_pick: '2.00',
    quantity_picked: '0.00',
    remaining: 2,
    status: 'pending',
    sequence: null,
    claimed_by: null,
    claimed_at: null,
    claim_expires_at: null,
    picked_at: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

function taskDetail(
  id: number,
  location: PickingTaskDetail['location']
): PickingTaskDetail {
  return {
    ...listRow({ id }),
    status: 'pending',
    fulfillment: undefined,
    location,
    op_seq: 90 + id,
    scan_log: [],
    notes: null,
  };
}

const rows: PickingTaskListItem[] = [
  listRow({ id: 1, sequence: 2 }),
  listRow({ id: 2, sequence: null }), // falls back to detail op_seq (92)
  listRow({ id: 3, sequence: 1 }),
];

const details: Record<number, PickingTaskDetail> = {
  1: taskDetail(1, { id: 900, location_id: 50, warehouse_id: 2, code: 'A-01', name: null, barcode: null, type: null, status: 'active' }),
  2: taskDetail(2, null), // unplaced task
  3: taskDetail(3, { id: 902, location_id: 30, warehouse_id: 2, code: 'B-02', name: null, barcode: null, type: null, status: 'active' }),
};

beforeEach(() => {
  mockedGet.mockReset();
  mockedGet.mockImplementation(async (url: unknown) => {
    const endpoint = String(url);
    if (endpoint.startsWith('/admin/picking-tasks?')) {
      expect(endpoint).toContain('batch_id=7');
      return { data: apiResponse(rows) } as never;
    }
    const id = Number(endpoint.split('/').pop());
    return { data: apiResponse(details[id]) } as never;
  });
  mockedPost.mockReset();
  mockedPost.mockImplementation(async (_url: unknown, body: unknown) => {
    const payload = body as { location_ids: number[] };
    const notFound = payload.location_ids.filter((id) => id > 900);
    const occupied = payload.location_ids
      .filter((id) => occupiedFixture[id] !== undefined)
      .map((id) => occupiedFixture[id]);
    const empty = payload.location_ids
      .filter((id) => occupiedFixture[id] === undefined && id <= 900)
      .map((id) => emptyFixture(id));
    const data: CheckOccupancyData = { empty, occupied, not_found: notFound };
    return { data: apiResponse(data) } as never;
  });
});

// ─── fetchLocationOccupancy ─────────────────────────────────────

function productRow(overrides: Partial<OccupancyProduct>): OccupancyProduct {
  return {
    placement_id: 1,
    product_id: 4,
    product_name: 'Sony WH-1000XM5',
    product_slug: 'sony-wh-1000xm5',
    product_sku: 'SKU-AUDIO-PRO',
    quantity: 1250,
    allocated_hint: 120,
    available_quantity: 1130,
    has_variant: false,
    variant: null,
    ...overrides,
  };
}

function occupiedRow(id: number): OccupiedLocation {
  return {
    id,
    warehouse_id: 1,
    code: `LOC-A-${id}`,
    barcode: `BAR-LOC-A-${id}`,
    name: `Bin ${id}`,
    type: 'storage',
    status: 'active',
    total_quantity: 1250,
    products_count: 1,
    products: [productRow({ placement_id: id })],
  };
}

const occupiedFixture: Record<number, OccupiedLocation> = {
  1: occupiedRow(1),
  52: occupiedRow(52),
};

function emptyFixture(id: number): CheckOccupancyData['empty'][number] {
  return {
    id,
    warehouse_id: 1,
    code: `LOC-B-${id}`,
    barcode: `BAR-LOC-B-${id}`,
    name: `Bin ${id}`,
    type: 'storage',
    status: 'active',
  };
}

describe('fetchPickRoute', () => {
  it('fans out to one detail per task and sorts stops by sequence', async () => {
    const route = await fetchPickRoute(7);

    expect(mockedGet).toHaveBeenCalledTimes(4); // 1 list + 3 details
    expect(mockedGet).toHaveBeenCalledWith('/admin/picking-tasks/1');
    expect(mockedGet).toHaveBeenCalledWith('/admin/picking-tasks/2');
    expect(mockedGet).toHaveBeenCalledWith('/admin/picking-tasks/3');

    // seq 1 (task 3) → seq 2 (task 1) → op_seq fallback 92 (task 2).
    expect(route.stops.map((stop) => stop.taskId)).toEqual([3, 1, 2]);
    expect(route.stops.map((stop) => stop.sequence)).toEqual([1, 2, 92]);
  });

  it('resolves true bin ids from the detail location block, not product_location_id', async () => {
    const route = await fetchPickRoute(7);

    expect(route.stops.find((s) => s.taskId === 1)?.locationId).toBe(50);
    expect(route.stops.find((s) => s.taskId === 1)?.locationCode).toBe('A-01');
  });

  it('counts unplaced tasks and keeps their stop location null', async () => {
    const route = await fetchPickRoute(7);

    const unplaced = route.stops.find((s) => s.taskId === 2);
    expect(unplaced?.locationId).toBeNull();
    expect(unplaced?.locationCode).toBeNull();
    expect(route.unplacedCount).toBe(1);
  });

  it('normalizes decimal-string quantities to numbers', async () => {
    const route = await fetchPickRoute(7);
    for (const stop of route.stops) expect(stop.quantityToPick).toBe(2);
    expect(route.batchId).toBe(7);
  });
});

describe('fetchLocationOccupancy', () => {
  it('chunks large id lists into ≤50-id POSTs and merges the pages', async () => {
    const ids = Array.from({ length: 60 }, (_, i) => i + 1); // 60 ids → 2 calls
    const result = await fetchLocationOccupancy(ids);

    expect(mockedPost).toHaveBeenCalledTimes(2);
    expect(mockedPost).toHaveBeenCalledWith('/admin/locations/check-occupancy', {
      location_ids: ids.slice(0, 50),
    });
    expect(mockedPost).toHaveBeenCalledWith('/admin/locations/check-occupancy', {
      location_ids: ids.slice(50),
    });

    // Occupied ids from both chunks merged, empty ids keyed off the plain
    // rows; this list holds no scope-unknown ids, so notFoundIds stays empty.
    expect(result.occupied.map((row) => row.id)).toEqual([1, 52]);
    expect(result.emptyIds).toEqual(ids.filter((id) => id !== 1 && id !== 52));
    expect(result.notFoundIds).toEqual([]);
  });

  it('sends a single POST within one chunk and omits warehouse_id when absent', async () => {
    const result = await fetchLocationOccupancy([1, 5, 999]);

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith('/admin/locations/check-occupancy', {
      location_ids: [1, 5, 999],
      // NO warehouse_id key when the caller doesn't scope the check.
    });

    expect(result.occupied.map((row) => row.id)).toEqual([1]);
    expect(result.emptyIds).toEqual([5]);
    expect(result.notFoundIds).toEqual([999]);
  });

  it('includes warehouse_id when the caller scopes the query', async () => {
    await fetchLocationOccupancy([1], 7);

    expect(mockedPost).toHaveBeenCalledWith('/admin/locations/check-occupancy', {
      location_ids: [1],
      warehouse_id: 7,
    });
  });

  it('returns empty buckets without firing requests for an empty id list', async () => {
    const result = await fetchLocationOccupancy([]);

    expect(mockedPost).not.toHaveBeenCalled();
    expect(result).toEqual({ occupied: [], emptyIds: [], notFoundIds: [] });
  });
});
