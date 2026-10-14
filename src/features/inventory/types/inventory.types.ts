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
