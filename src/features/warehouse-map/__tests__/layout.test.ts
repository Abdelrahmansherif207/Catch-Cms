import { describe, expect, it } from 'vitest';
import type { WarehouseLocation } from '@/features/locations/types/location.types';
import {
  aisleKeyFromCode,
  BINS_PER_COLUMN,
  BIN_NODE_WIDTH,
  buildBinLayout,
  slotFromCode,
  stripCodeNamespace,
} from '../lib/layout';

/** Minimal WarehouseLocation factory — only the fields the layout reads. */
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

describe('aisleKeyFromCode', () => {
  it('extracts the leading alpha run, uppercased', () => {
    expect(aisleKeyFromCode('A-01')).toBe('A');
    expect(aisleKeyFromCode('ab-12')).toBe('AB');
    expect(aisleKeyFromCode(' R7')).toBe('R');
  });

  it('returns null for codes without letters', () => {
    expect(aisleKeyFromCode('101')).toBeNull();
    expect(aisleKeyFromCode('')).toBeNull();
    expect(aisleKeyFromCode('12-3')).toBeNull();
  });
});

describe('slotFromCode', () => {
  it('extracts trailing digits as a number', () => {
    expect(slotFromCode('A-01')).toBe(1);
    expect(slotFromCode('A-10')).toBe(10);
    expect(slotFromCode('R10')).toBe(10);
    expect(slotFromCode('B 3 ')).toBe(3);
  });

  it('returns null when there are no digits', () => {
    expect(slotFromCode('A')).toBeNull();
    expect(slotFromCode('ABC')).toBeNull();
  });
});

describe('stripCodeNamespace', () => {
  it('strips when every root code carries ≥3 segments with one shared first segment', () => {
    const bins = [
      bin({ id: 1, code: 'LOC-A-01-01' }),
      bin({ id: 2, code: 'LOC-BULK-01' }),
      bin({ id: 3, code: 'LOC-AX-B-01' }),
    ];
    expect(stripCodeNamespace(bins)).toBe(true);
  });

  it('does not strip when a code lacks 3 segments (doc-style A-01)', () => {
    const bins = [
      bin({ id: 1, code: 'LOC-A-01-01' }),
      bin({ id: 2, code: 'A-02' }),
    ];
    expect(stripCodeNamespace(bins)).toBe(false);
  });

  it('does not strip when first segments differ or codes are letterless', () => {
    expect(stripCodeNamespace([bin({ id: 1, code: 'LOC-A-01' }), bin({ id: 2, code: 'BIN-9' })])).toBe(false);
    expect(stripCodeNamespace([bin({ id: 1, code: '101' }), bin({ id: 2, code: 'LOC-A-01' })])).toBe(false);
    expect(stripCodeNamespace([])).toBe(false);
  });
});

describe('buildBinLayout', () => {
  it('returns an empty layout for no bins', () => {
    const layout = buildBinLayout([]);
    expect(layout.bins).toEqual([]);
    expect(layout.groups).toEqual([]);
  });

  it('groups code-prefixed bins into aisle columns and sorts by slot', () => {
    const layout = buildBinLayout([
      bin({ id: 3, code: 'A-02' }),
      bin({ id: 1, code: 'A-01' }),
      bin({ id: 2, code: 'A-10' }),
      bin({ id: 4, code: 'B-01' }),
    ]);

    expect(layout.groups.map((g) => g.key)).toEqual(['aisle:A', 'aisle:B']);
    expect(layout.groups.map((g) => g.count)).toEqual([3, 1]);

    const aisleA = layout.bins.filter((b) => b.groupKey === 'aisle:A');
    expect(aisleA.map((b) => b.location.code)).toEqual(['A-01', 'A-02', 'A-10']);

    // Column B starts strictly to the right of every A bin.
    const bBin = layout.bins.find((b) => b.location.code === 'B-01')!;
    for (const a of aisleA) expect(bBin.x).toBeGreaterThan(a.x);
  });

  it('orders bins without digit slots by code, deterministically', () => {
    const locations = [bin({ id: 1, code: 'A-x' }), bin({ id: 2, code: 'A-b' }), bin({ id: 3, code: 'A-c' })];
    const first = buildBinLayout(locations);
    const second = buildBinLayout([...locations].reverse());

    expect(first.bins.map((b) => b.location.code)).toEqual(['A-b', 'A-c', 'A-x']);
    // Byte-identical across calls and input order — no locale/insertion drift.
    expect(second).toEqual(first);
  });

  it('puts letterless codes in the unsorted group, listed last', () => {
    const layout = buildBinLayout([bin({ id: 2, code: '101' }), bin({ id: 1, code: 'B-01' })]);

    expect(layout.groups.map((g) => g.kind)).toEqual(['aisle', 'unsorted']);
    const lastGroup = layout.groups[layout.groups.length - 1];
    expect(lastGroup.kind).toBe('unsorted');
  });

  it('groups children under their parent and labels the column with the parent code', () => {
    const parent = bin({ id: 10, code: 'ZONE-1' });
    const childA = bin({ id: 11, code: 'X-01', parent_id: 10 });
    const childB = bin({ id: 12, code: 'Y-02', parent_id: 10 });

    const layout = buildBinLayout([parent, childA, childB]);

    const group = layout.groups.find((g) => g.key === 'parent:10');
    expect(group).toBeDefined();
    expect(group?.label).toBe('ZONE-1');
    expect(group?.count).toBe(2); // children only — the parent itself is its own aisle column

    const children = layout.bins.filter((b) => b.groupKey === 'parent:10');
    expect(children.map((b) => b.location.id)).toEqual([11, 12]);
  });

  it('falls back to a #id label when the parent row is missing (truncation edge)', () => {
    const orphan = bin({ id: 13, code: 'Z-01', parent_id: 999 });
    const layout = buildBinLayout([orphan]);

    const group = layout.groups.find((g) => g.key === 'parent:999');
    expect(group?.label).toBe('#999');
  });

  it('groups namespaced codes by the SECOND segment (live meem shapes)', () => {
    // Live wh1+wh3 codes: everything starts with LOC — leading-letters
    // grouping would pile all bins into one meaningless "LOC" column.
    const layout = buildBinLayout([
      bin({ id: 18, code: 'LOC-PICK-01' }),
      bin({ id: 23, code: 'LOC-A-01-01' }),
      bin({ id: 27, code: 'LOC-A-02-01' }),
      bin({ id: 29, code: 'LOC-RCV-01' }),
      bin({ id: 11, code: 'LOC-BULK-01' }),
    ]);

    expect(layout.groups.map((group) => [group.kind, group.label])).toEqual([
      ['aisle', 'A'],
      ['aisle', 'BULK'],
      ['aisle', 'PICK'],
      ['aisle', 'RCV'],
    ]);
  });

  it('sorts namespaced bins inside an aisle by their trailing slot then code', () => {
    const layout = buildBinLayout([
      bin({ id: 3, code: 'LOC-A-02-01' }),
      bin({ id: 1, code: 'LOC-A-01-01' }),
      bin({ id: 2, code: 'LOC-A-01-02' }),
    ]);

    const aisle = layout.bins.filter((b) => b.groupKey === 'aisle:A');
    expect(aisle.map((b) => b.location.code)).toEqual([
      'LOC-A-01-01',
      'LOC-A-01-02',
      'LOC-A-02-01',
    ]);
  });

  it('falls back to leading-letters grouping when the set mixes namespaces', () => {
    const layout = buildBinLayout([
      bin({ id: 1, code: 'LOC-A-01-01' }),
      bin({ id: 2, code: 'BIN-9' }),
    ]);

    expect(layout.groups.map((group) => group.label)).toEqual(['BIN', 'LOC']);
  });

  it('wraps a long aisle into sub-columns at BINS_PER_COLUMN', () => {
    const locations = Array.from({ length: BINS_PER_COLUMN + 2 }, (_, i) =>
      bin({ id: i + 1, code: `A-${String(i + 1).padStart(2, '0')}` })
    );
    const layout = buildBinLayout(locations);

    const aisle = layout.bins.filter((b) => b.groupKey === 'aisle:A');
    expect(aisle).toHaveLength(BINS_PER_COLUMN + 2);

    // First BINS_PER_COLUMN bins share column 0; overflow moves right and back to the top.
    const first = aisle[0];
    const overflow = aisle[BINS_PER_COLUMN];
    expect(overflow.x).toBeGreaterThan(first.x);
    expect(overflow.y).toBe(first.y);
    // Sub-columns sit exactly one node width + gap apart.
    expect(overflow.x - first.x).toBeGreaterThan(BIN_NODE_WIDTH);
  });

  it('is fully deterministic for a mixed warehouse', () => {
    const locations = [
      bin({ id: 1, code: 'A-01' }),
      bin({ id: 2, code: 'A-02' }),
      bin({ id: 3, code: 'B-01' }),
      bin({ id: 4, code: '101' }),
      bin({ id: 5, code: 'C-01', parent_id: 3 }),
      bin({ id: 6, code: 'C-02', parent_id: 3 }),
    ];

    expect(JSON.stringify(buildBinLayout(locations))).toBe(
      JSON.stringify(buildBinLayout([...locations].reverse()))
    );
  });
});
