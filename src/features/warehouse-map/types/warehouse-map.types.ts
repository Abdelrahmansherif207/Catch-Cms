import type { WarehouseLocation } from '@/features/locations/types/location.types';

/** How a canvas column (group) was derived for a set of bins. */
export type BinGroupKind = 'parent' | 'aisle' | 'unsorted';

/** One labeled column of bins on the map. */
export interface BinGroup {
  key: string;
  kind: BinGroupKind;
  /** Raw label (parent code / aisle letters); 'unsorted' is translated at render time. */
  label: string;
  count: number;
  x: number;
  y: number;
}

/** A bin with its deterministic auto-layout position. */
export interface PositionedBin {
  location: WarehouseLocation;
  groupKey: string;
  /** Stable ordering slot inside the group (across wrapped sub-columns). */
  slotIndex: number;
  x: number;
  y: number;
}

export interface BinLayout {
  bins: PositionedBin[];
  groups: BinGroup[];
}

/** One resolved stop of a picking batch route (bin = locations-table id). */
export interface PickRouteStop {
  taskId: number;
  sequence: number;
  orderId: number;
  quantityToPick: number;
  /** Null when the task has no placement yet — skipped on the canvas path. */
  locationId: number | null;
  locationCode: string | null;
}

export interface PickRoute {
  batchId: number;
  /** Sorted by sequence (then taskId) — the walking order. */
  stops: PickRouteStop[];
  /** Tasks whose placement is unassigned — surfaced in the side panel. */
  unplacedCount: number;
}

// ─── Bin contents (check-occupancy) ─────────────────────────────────────
// LIVE CONTRACT (curl-verified on meem, 2026-10-20): POST
// /admin/locations/check-occupancy answers per requested location as
// empty (plain location row), occupied (with its placements/api/products)
// or not_found (ids outside scope / unknown — never echoed back as rows).

export interface OccupancyVariantAttribute {
  name: string;
  value: string;
  attribute_id: number;
  attribute_value_id: number;
}

export interface OccupancyVariant {
  id: number;
  sku: string;
  price: number;
  sale_price: number;
  stock_quantity: number;
  attributes: OccupancyVariantAttribute[];
}

/** One product-bearing placement of an occupied location. */
export interface OccupancyProduct {
  placement_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_sku: string;
  /** Physical quantity stored — sums > 0 make the bin "occupied". */
  quantity: number;
  allocated_hint: number;
  /** quantity − allocated_hint, resolved server-side. */
  available_quantity: number;
  has_variant: boolean;
  variant: OccupancyVariant | null;
}

/** Bare location row — also the shape of `empty` entries (no products block). */
export interface OccupancyLocation {
  id: number;
  warehouse_id: number;
  code: string;
  barcode: string;
  name: string;
  type: string;
  status: string;
}

export interface OccupiedLocation extends OccupancyLocation {
  total_quantity: number;
  products_count: number;
  products: OccupancyProduct[];
}

export interface CheckOccupancyData {
  empty: OccupancyLocation[];
  occupied: OccupiedLocation[];
  not_found: number[];
}

export type CheckOccupancyResponse = {
  status: number;
  message: string;
  success?: boolean;
  data: CheckOccupancyData;
};
