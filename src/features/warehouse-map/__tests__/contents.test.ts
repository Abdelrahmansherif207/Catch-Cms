import { describe, expect, it } from 'vitest';
import type {
  OccupancyProduct,
  OccupancyVariant,
  OccupiedLocation,
} from '../types/warehouse-map.types';
import {
  aggregateContents,
  formatUnits,
  variantAttributesLabel,
} from '../lib/contents';

function variantRow(overrides: Partial<OccupancyVariant> = {}): OccupancyVariant {
  return {
    id: 1,
    sku: 'VAR-HOODIE-M',
    price: 120,
    sale_price: 120,
    stock_quantity: 500,
    attributes: [
      { name: 'Size', value: 'Medium', attribute_id: 1, attribute_value_id: 1 },
    ],
    ...overrides,
  };
}

function productRow(
  overrides: Partial<OccupancyProduct> & { placement_id: number; product_id: number }
): OccupancyProduct {
  return {
    product_name: `Product ${overrides.product_id}`,
    product_slug: `product-${overrides.product_id}`,
    product_sku: `SKU-${overrides.product_id}`,
    quantity: 1,
    allocated_hint: 0,
    available_quantity: overrides.quantity ?? 1,
    has_variant: false,
    variant: null,
    ...overrides,
  };
}

/** Live-shaped occupied row (meem, 2026-10-20). */
function occupiedRow(
  id: number,
  code: string,
  products: OccupancyProduct[],
  totalQuantity?: number
): OccupiedLocation {
  return {
    id,
    warehouse_id: 1,
    code,
    barcode: `BAR-${code}`,
    name: `Bin ${code}`,
    type: 'storage',
    status: 'active',
    total_quantity: totalQuantity ?? products.reduce((sum, row) => sum + row.quantity, 0),
    products_count: products.length,
    products,
  };
}

const SONY = productRow({
  placement_id: 1,
  product_id: 4,
  product_name: 'Sony WH-1000XM5 Wireless Headphones',
  product_sku: 'SKU-AUDIO-PRO',
  quantity: 1250,
  allocated_hint: 120,
  available_quantity: 1130,
});
const HOODIE_M = productRow({
  placement_id: 8,
  product_id: 7,
  product_name: 'Heavyweight Fleece Winter Hoodie',
  product_sku: 'SKU-HOODIE-VARSITY',
  quantity: 200,
  allocated_hint: 15,
  available_quantity: 185,
  has_variant: true,
  variant: variantRow(),
});
const HOODIE_L = productRow({
  placement_id: 10,
  product_id: 7,
  product_name: 'Heavyweight Fleece Winter Hoodie',
  product_sku: 'SKU-HOODIE-VARSITY',
  quantity: 200,
  allocated_hint: 15,
  available_quantity: 185,
  has_variant: true,
  variant: variantRow({ id: 2, sku: 'VAR-HOODIE-L', attributes: [
    { name: 'Size', value: 'Large', attribute_id: 1, attribute_value_id: 2 },
  ] }),
});

describe('aggregateContents', () => {
  it('returns empty maps for an all-empty warehouse', () => {
    const index = aggregateContents([]);
    expect(index.byLocation.size).toBe(0);
    expect(index.byProduct.size).toBe(0);
  });

  it('summarizes per-bin products + units (live multi-variant bin)', () => {
    const index = aggregateContents([
      occupiedRow(1, 'LOC-A-01-01', [SONY], 1250),
      occupiedRow(15, 'LOC-AX-02-02', [HOODIE_M, HOODIE_L]),
    ]);

    const bin1 = index.byLocation.get(1);
    expect(bin1?.totalQuantity).toBe(1250);
    expect(bin1?.products).toHaveLength(1);

    const bin15 = index.byLocation.get(15);
    expect(bin15?.totalQuantity).toBe(400);
    expect(bin15?.products.map((row) => row.placement_id)).toEqual([8, 10]);
  });

  it('indexes one product across bins, deduplicating same-bin rows', () => {
    const index = aggregateContents([
      occupiedRow(15, 'LOC-AX-02-02', [HOODIE_M, HOODIE_L]),
      occupiedRow(16, 'LOC-AX-B-01', [HOODIE_M]),
    ]);

    /** Same product across bins; the two same-bin rows must not duplicate the bin. */
    const hoodie = index.byProduct.get(7);
    expect(hoodie?.locationIds).toEqual([15, 16]);
    expect(hoodie?.binsCount).toBe(2);
    expect(hoodie?.totalQuantity).toBe(600); // 200 (bin15 M) + 200 (bin15 L) + 200 (bin16 M)
    expect(hoodie?.sku).toBe('SKU-HOODIE-VARSITY');
  });

  it('keeps distinct products under distinct ids', () => {
    const index = aggregateContents([
      occupiedRow(1, 'LOC-A-01-01', [SONY, HOODIE_L]),
    ]);

    expect(index.byProduct.size).toBe(2);
    expect(index.byProduct.get(4)?.locationIds).toEqual([1]);
    expect(index.byProduct.get(7)?.locationIds).toEqual([1]);
  });

  it('is deterministic for identical input order', () => {
    const rows = [
      occupiedRow(1, 'LOC-A-01-01', [SONY], 1250),
      occupiedRow(15, 'LOC-AX-02-02', [HOODIE_M, HOODIE_L]),
    ];
    expect(JSON.stringify(aggregateContents(rows).byProduct.get(7))).toBe(
      JSON.stringify(aggregateContents([...rows].reverse()).byProduct.get(7))
    );
  });
});

describe('formatUnits', () => {
  it('keeps integers as-is', () => {
    expect(formatUnits(1250)).toBe('1250');
    expect(formatUnits(0)).toBe('0');
  });

  it('trims float noise to 2dp', () => {
    expect(formatUnits(12.5)).toBe('12.5');
    expect(formatUnits(3.0)).toBe('3');
    expect(formatUnits(2.675)).toBe('2.68');
  });
});

describe('variantAttributesLabel', () => {
  it('returns null for non-variant rows', () => {
    expect(variantAttributesLabel(null)).toBeNull();
  });

  it('joins attribute name/value pairs', () => {
    const label = variantAttributesLabel(
      variantRow({ attributes: [
        { name: 'Size', value: 'Medium', attribute_id: 1, attribute_value_id: 1 },
        { name: 'Color', value: 'Red', attribute_id: 2, attribute_value_id: 5 },
      ] })
    );
    expect(label).toBe('Size: Medium · Color: Red');
  });

  it('returns null when the variant carries no attributes', () => {
    expect(variantAttributesLabel(variantRow({ attributes: [] }))).toBeNull();
  });
});
