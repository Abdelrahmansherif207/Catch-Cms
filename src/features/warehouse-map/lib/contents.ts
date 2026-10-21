import type {
  OccupancyVariant,
  OccupiedLocation,
} from '../types/warehouse-map.types';

/** Per-bin contents as consumed by the node chips + details panel. */
export interface BinContentsSummary {
  products: OccupiedLocation['products'];
  /** Server-truthful `total_quantity` (sum of placement quantities). */
  totalQuantity: number;
}

/** One product aggregated across every mapped bin (sidebar index). */
export interface ProductOnMap {
  productId: number;
  name: string;
  sku: string;
  /** Bin ids holding this product, in first-seen order. */
  locationIds: number[];
  /** = locationIds.length (kept as its own field for template readability). */
  binsCount: number;
  totalQuantity: number;
}

/** Client-side post-processing of one check-occupancy warehouse response. */
export interface ContentsIndex {
  byLocation: Map<number, BinContentsSummary>;
  byProduct: Map<number, ProductOnMap>;
}

interface ProductDraft {
  productId: number;
  name: string;
  sku: string;
  locationIds: number[];
  bins: Set<number>;
  totalQuantity: number;
}

/**
 * Aggregates the `occupied` rows of a check-occupancy response into the two
 * views the map needs:
 * - `byLocation` — products + total units per bin (chips, details panel)
 * - `byProduct` — one entry per product with its bin list (sidebar, focus mode)
 * Pure and deterministic — safe to memoize against the response object.
 */
export function aggregateContents(occupied: readonly OccupiedLocation[]): ContentsIndex {
  const byLocation = new Map<number, BinContentsSummary>();
  const drafts = new Map<number, ProductDraft>();

  for (const location of occupied) {
    const products = location.products ?? [];
    byLocation.set(location.id, {
      products,
      totalQuantity: location.total_quantity ?? products.reduce(
        (sum, row) => sum + (row.quantity ?? 0),
        0
      ),
    });

    for (const row of products) {
      if (!drafts.has(row.product_id)) {
        drafts.set(row.product_id, {
          productId: row.product_id,
          name: row.product_name,
          sku: row.product_sku,
          locationIds: [],
          bins: new Set(),
          totalQuantity: 0,
        });
      }
      const draft = drafts.get(row.product_id)!;
      if (!draft.bins.has(location.id)) {
        draft.bins.add(location.id);
        draft.locationIds.push(location.id);
      }
      draft.totalQuantity += row.quantity ?? 0;
    }
  }

  const byProduct = new Map(
    [...drafts.entries()].map(([productId, draft]) => {
      const { bins, ...rest } = draft;
      const entry: ProductOnMap = { ...rest, binsCount: bins.size };
      return [productId, entry];
    })
  );

  return { byLocation, byProduct };
}

/** Compacts numeric list display: ints stay ints, floats keep 2dp precision. */
export function formatUnits(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/** "Size: Medium · Color: Red" — names/values come localized per session header. */
export function variantAttributesLabel(variant: OccupancyVariant | null): string | null {
  if (!variant) return null;
  const parts = variant.attributes.map(
    (attribute) => `${attribute.name}: ${attribute.value}`
  );
  return parts.length > 0 ? parts.join(' · ') : null;
}
