import { describe, expect, it } from 'vitest';
import type { WarehouseLocation } from '@/features/locations/types/location.types';
import { buildBinLayout, GROUP_HEADER_HEIGHT } from '../lib/layout';
import { binsOfGroup, mergePositions, withOverrides } from '../lib/layout-override';

function bin(overrides: Partial<WarehouseLocation> & { id: number; code: string }): WarehouseLocation {
  return {
    warehouse_id: 1,
    parent_id: null,
    name: `Bin ${overrides.code}`,
    barcode: null,
    type: null,
    status: 'active',
    priority: null,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    ...overrides,
  };
}

const BASE = buildBinLayout([bin({ id: 1, code: 'A-01' }), bin({ id: 2, code: 'A-02' })]);

describe('mergePositions', () => {
  it('lets edits win over saved and keeps untouched saved rows', () => {
    const merged = mergePositions(
      new Map([[1, { x: 10, y: 10 }]]),
      new Map([[1, { x: 99, y: 99 }], [2, { x: 5, y: 5 }]])
    );
    expect(merged.get(1)).toEqual({ x: 99, y: 99 });
    expect(merged.get(2)).toEqual({ x: 5, y: 5 });
    expect(merged.size).toBe(2);
  });
});

describe('withOverrides', () => {
  it('moves overridden bins and leaves the rest at their auto spots', () => {
    const layout = withOverrides(BASE, new Map([[1, { x: 400, y: 300 }]]));
    const bin1 = layout.bins.find((b) => b.location.id === 1)!;
    const bin2 = layout.bins.find((b) => b.location.id === 2)!;
    expect({ x: bin1.x, y: bin1.y }).toEqual({ x: 400, y: 300 });
    expect({ x: bin2.x, y: bin2.y }).toEqual({ x: BASE.bins[1].x, y: BASE.bins[1].y });
  });

  it('re-derives each group header from its member bins', () => {
    const layout = withOverrides(BASE, new Map([
      [1, { x: 500, y: 700 }],
      [2, { x: 480, y: 660 }],
    ]));
    const group = layout.groups[0];
    // min x / min y of members — header rides along above the top-left bin.
    expect(group.x).toBe(480);
    expect(group.y).toBe(660 - GROUP_HEADER_HEIGHT);
  });

  it('is identity when no overrides exist', () => {
    expect(withOverrides(BASE, new Map())).toEqual(BASE);
  });
});

describe('binsOfGroup', () => {
  it('returns the bins of one group in layout order', () => {
    const members = binsOfGroup(BASE, BASE.groups[0].key);
    expect(members.map((b) => b.location.id)).toEqual([1, 2]);
    expect(binsOfGroup(BASE, 'missing:key')).toEqual([]);
  });
});
