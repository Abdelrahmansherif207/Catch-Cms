import { axiosClient } from '@/shared/api';
import type {
  EmptyLocationResponse,
  FetchProductPlacementsParams,
  InventoryOverviewResponse,
  ProductPlacementsResponse,
  ReceiveStockData,
  ReceiveStockResponse,
  StockOperationsResponse,
  TransferStockData,
  TransferStockResponse,
} from '../types/inventory.types';

/**
 * LIVE CONTRACT (catch, 2026-10-13): unlike the locations CRUD family, BOTH
 * inventory write endpoints DO parse application/json bodies (per-field
 * validation errors returned) — bodies are sent as plain JSON objects, the
 * axiosClient default Content-Type applies.
 */

export async function receiveStock(
  locationId: number | string,
  payload: ReceiveStockData
): Promise<ReceiveStockResponse> {
  const { data } = await axiosClient.post<ReceiveStockResponse>(
    `/admin/locations/${locationId}/stock-receipts`,
    payload
  );
  return data;
}

export async function transferStock(
  payload: TransferStockData
): Promise<TransferStockResponse> {
  const { data } = await axiosClient.post<TransferStockResponse>(
    '/admin/stock-transfers',
    payload
  );
  return data;
}

/**
 * GET /admin/inventory/overview — live-verified 2026-10-14 (meem): stock
 * totals are GLOBAL, active_bins/today_transactions are warehouse-scoped.
 * The optional warehouse filter narrows scope only and is honored only for
 * manage-warehouse holders (scoped callers are confined to home anyway).
 */
export async function fetchInventoryOverview(
  warehouseId?: number
): Promise<InventoryOverviewResponse> {
  const query = warehouseId !== undefined ? `?warehouse_id=${warehouseId}` : '';
  const { data } = await axiosClient.get<InventoryOverviewResponse>(
    `/admin/inventory/overview${query}`
  );
  return data;
}

/**
 * GET /admin/products/{product}/placements — the multi-location read model.
 * Rows are product_locations rows ({id} = the product_location_id used by
 * assign-placement). EMPTY placements are still 200 — authority stock can
 * exist without hint rows (live-verified: product 1682, authority 100, []).
 */
export async function fetchProductPlacements(
  productId: number | string,
  params: FetchProductPlacementsParams = {}
): Promise<ProductPlacementsResponse> {
  const search = new URLSearchParams();
  if (params.warehouse_id !== undefined) {
    search.set('warehouse_id', String(params.warehouse_id));
  }
  if (params.product_variant_id !== undefined) {
    search.set('product_variant_id', String(params.product_variant_id));
  }
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const { data } = await axiosClient.get<ProductPlacementsResponse>(
    `/admin/products/${productId}/placements${suffix}`
  );
  return data;
}

/**
 * DELETE /admin/locations/{location}/products — empties eligible (qty 0 AND
 * allocated_hint 0) placement rows; the bin row itself always survives; the
 * server refuses stocked / picking-worked bins with translated 422 flat
 * texts; already-empty is an idempotent 200 with a 0-count payload.
 */
export async function emptyLocation(
  locationId: number | string
): Promise<EmptyLocationResponse> {
  const { data } = await axiosClient.delete<EmptyLocationResponse>(
    `/admin/locations/${locationId}/products`
  );
  return data;
}

/**
 * GET /admin/inventory/operations — the stock ledger feed (Recent Activity).
 * Live-verified 2026-10-14 on meem: flat data array, newest first; the
 * server ignores ?limit (all rows returned, no paginator envelope) so the
 * UI trims client-side.
 */
export async function fetchStockOperations(): Promise<StockOperationsResponse> {
  const { data } = await axiosClient.get<StockOperationsResponse>(
    '/admin/inventory/operations'
  );
  return data;
}
