/**
 * Inventory stock contracts — live-verified on catch 2026-10-13
 * (updateDocs/inventory-stock-verification-2026-10-13.md).
 *
 * Both operations return the SAME envelope shape:
 * { status, message, success, data: { operation: StockOperation, replayed: bool } }
 * The endpoint answers 201 on a fresh operation and 200 (with replayed: true)
 * when an idempotency key replays an already-processed outcome.
 */

/** A product's physical stock row at one bin (placement). Live-verified shape. */
export interface StockPlacement {
  id: number;
  product_id: number;
  location_id: number;
  warehouse_id: number;
  quantity: number;
  allocated_hint: number;
}

/**
 * Live-verified resource (StockOperationResource):
 * - receipts fill placement + received_quantity + live available/in_stock
 * - transfers fill source_placement/destination_placement + transferred_quantity
 *   and NULL available/in_stock (live quirk, kept nullable here)
 */
export interface StockOperation {
  product_id: number;
  warehouse_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number | null;
  in_stock: boolean | null;
  received_quantity: number | null;
  transferred_quantity: number | null;
  placement: StockPlacement | null;
  source_placement: StockPlacement | null;
  destination_placement: StockPlacement | null;
  reference: string | null;
}

/** POST /admin/locations/{location}/stock-receipts */
export interface ReceiveStockData {
  product_id: number;
  quantity: number;
  reference?: string | null;
  idempotency_key?: string | null;
}

/** POST /admin/stock-transfers */
export interface TransferStockData {
  product_id: number;
  source_location_id: number;
  destination_location_id: number;
  quantity: number;
  reference?: string | null;
  idempotency_key?: string | null;
}

export interface StockOperationResultData {
  operation: StockOperation;
  replayed: boolean;
}

export interface InventoryApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export type ReceiveStockResponse = InventoryApiResponse<StockOperationResultData>;
export type TransferStockResponse = InventoryApiResponse<StockOperationResultData>;

/** int32 — server rule max:2147483647 (live-verified at validation). */
export const MAX_QUANTITY = 2147483647;
export type QuantityBounds = { min: number; max: number };

/**
 * Bin types PROVEN refused by the receipt engine (live 422 literal on catch:
 * "Location #N (type quarantine) is not placeable."). Everything else —
 * including untyped (null) bins that the locations API freely returns — is
 * left for the backend to adjudicate; a refusal surfaces as its verbatim
 * 422 toast, so the picker never has to guess.
 */
export const NON_PLACEABLE_LOCATION_TYPES = [
  'quarantine',
  'damaged',
  'returns',
] as const;

/**
 * Picker-side exclusion set (NOT the backend rule):
 * - explicitly INACTIVE bins refuse stock ("Location #N is not active...")
 * - the three non-placeable types refuse stock (guard runs first)
 * Bins with status null (the locations create quirk — activation is a
 * separate command) and untyped bins STAY selectable: the endpoint, not the
 * UI, is the authority on whether the guard accepts them.
 */
export function isStockCapableBin(location: {
  status: string | null;
  type: string | null;
}): boolean {
  if (location.status === 'inactive') return false;
  if (
    location.type !== null &&
    (NON_PLACEABLE_LOCATION_TYPES as readonly string[]).includes(location.type)
  ) {
    return false;
  }
  return true;
}

/** Minimal product shape the picker needs (admin /products search rows). */
export interface ReceivableProduct {
  id: number;
  name: string;
  product_type?: string | null;
  item_type?: 'PHYSICAL' | 'DIGITAL';
  variants?: Array<unknown>;
}

export function isReceivableProduct(product: ReceivableProduct): boolean {
  if (product.item_type === 'DIGITAL') return false;
  if (product.product_type === 'variable') return false;
  if (Array.isArray(product.variants) && product.variants.length > 0) return false;
  return true;
}

// ─── Inventory overview (GET /admin/inventory/overview) ─────────
// Live-verified on meem 2026-10-14: stock totals are GLOBAL for every
// caller; only active_bins/today_transactions follow the warehouse scope.
// `totals_scope` is a LIVE-ONLY 7th key the Apidog doc does not list.

export interface InventoryOverviewData {
  total_sku_units: number;
  simple_units: number;
  variant_units: number;
  totals_scope: string;
  active_bins: number;
  today_transactions: number;
  warehouse_id: number | null;
}

export type InventoryOverviewResponse = InventoryApiResponse<InventoryOverviewData>;

// ─── Product placements (GET /admin/products/{product}/placements) ──
// The multi-location read model: rows ARE product_locations rows —
// their `id` is exactly the product_location_id the future
// assign-placement endpoint expects.

export interface VariantStockRow {
  id: number;
  sku: string | null;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  in_stock: boolean;
  attributes: Array<{ attribute: string; value: string }>;
}

/** Global catalog header — scope confines PLACEMENTS only, never this. */
export interface ProductPlacementsHeader {
  id: number;
  sku: string | null;
  product_type: string | null;
  has_variants: boolean;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  in_stock: boolean;
  variants: VariantStockRow[];
}

export interface ProductPlacementRow {
  id: number;
  product_id: number;
  product_variant_id: number | null;
  sku: string | null;
  variant_attributes: Array<{ attribute: string; value: string }> | null;
  location_id: number;
  location_code: string | null;
  warehouse_id: number;
  quantity: number;
  allocated_hint: number;
  allocated_hint_note: string;
}

export interface ProductPlacementsData {
  product: ProductPlacementsHeader;
  placements: ProductPlacementRow[];
}

export type ProductPlacementsResponse = InventoryApiResponse<ProductPlacementsData>;

export interface FetchProductPlacementsParams {
  warehouse_id?: number;
  product_variant_id?: number;
}

// ─── Empty bin (DELETE /admin/locations/{location}/products) ────────

export interface EmptyLocationResultData {
  location_id: number;
  warehouse_id: number;
  removed: number;
  removed_ids: number[];
  remaining: number;
}

export type EmptyLocationResponse = InventoryApiResponse<EmptyLocationResultData>;

// ─── Stock operations ledger (GET /admin/inventory/operations) ──────
// Live-verified 2026-10-14 on meem: FLAT array under data (no paginator
// envelope), newest first by the server; the server IGNORES ?limit — the UI
// caps display client-side. Index product objects carry product_type: null.

export type StockOperationStatus = 'completed' | 'processing' | 'failed';
export type StockOperationKind = 'receipt' | 'transfer' | 'initial_placement';

export interface StockOperationLedgerProduct {
  id: number;
  name: string;
  sku: string | null;
  product_type: string | null;
}

export interface StockOperationLedgerBin {
  id: number;
  code: string;
  name: string;
}

export interface StockOperationLedgerRow {
  id: number;
  key: string | null;
  operation: StockOperationKind | string;
  status: StockOperationStatus | string;
  product_id: number;
  product_variant_id: number | null;
  warehouse_id: number | null;
  source_location_id: number | null;
  destination_location_id: number | null;
  quantity: number;
  reference: string | null;
  product: StockOperationLedgerProduct | null;
  warehouse: { id: number; name: string; code: string } | null;
  source_location: StockOperationLedgerBin | null;
  destination_location: StockOperationLedgerBin | null;
  result: unknown | null;
  created_at: string | null;
  updated_at: string | null;
}

export type StockOperationsResponse = InventoryApiResponse<StockOperationLedgerRow[]>;
