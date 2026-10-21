import type { WarehouseLocation } from '@/features/locations/types/location.types';
import type { BinGroup, BinLayout, PositionedBin } from '../types/warehouse-map.types';

// ─── Canvas geometry (px) ─────────────────────────────────────────────
// Read-only map — positions are computed, never dragged, so fixed pitches
// keep the layout stable across reloads and users.
export const BIN_NODE_WIDTH = 96;
export const BIN_NODE_HEIGHT = 64;
/** Bins stacked per column before a group wraps into a sub-column. */
export const BINS_PER_COLUMN = 10;
const GROUP_GAP_X = 64; // between group columns
const SUB_GAP_X = 24; // between wrapped sub-columns of one group
const BIN_GAP_Y = 16; // between bins in a column
/** Vertical space reserved above the first bin for the group label node. */
export const GROUP_HEADER_HEIGHT = 56;
const ORIGIN_X = 40;
const ORIGIN_Y = 40;

/**
 * Leading alpha run of a bin code — "A-01" → "A", "ab-12" → "AB".
 * Pure digits ("101") yield null → the unsorted bucket.
 */
export function aisleKeyFromCode(code: string): string | null {
  const match = /^[ \t]*([A-Za-z]+)/.exec(code);
  return match ? match[1].toUpperCase() : null;
}

/** Trailing digits of a bin code — "A-01" → 1, "R10" → 10; null when none. */
export function slotFromCode(code: string): number | null {
  const match = /(\d+)[ \t]*$/.exec(code);
  return match ? Number(match[1]) : null;
}

/**
 * Separator-split segments of a bin code — "LOC-A-01-01" →
 * ["LOC","A","01","01"]. Used for live-style NAMESPACED codes where every
 * bin shares a first segment: leading-letters grouping would then pile all
 * bins into one meaningless "LOC" column.
 */
function parseCodeSegments(code: string): string[] {
  return code.match(/[A-Za-z0-9]+/g) ?? [];
}

/**
 * Bin key for aisle grouping. With `stripNamespace`, the meaningful group is
 * the SECOND segment ("LOC-A-01-01" → "A"); otherwise the classic leading
 * alpha run applies. A code that yields neither falls to the unsorted bucket.
 */
function aisleGroupKeyFor(code: string, stripNamespace: boolean): string | null {
  if (stripNamespace) {
    const segments = parseCodeSegments(code);
    return segments.length >= 2 ? segments[1].toUpperCase() : null;
  }
  return aisleKeyFromCode(code);
}

/**
 * Namespace detection: strip ONLY when every root bin's code carries ≥ 3
 * segments AND the first segment is identical for ALL of them (e.g. live
 * meem codes "LOC-A-01-01", "LOC-BULK-01"…). All-or-nothing keeps grouping
 * fully deterministic — one outlier forces the classic letter-prefix path.
 * The 3-segment floor shields doc-style two-part codes like
 * "A-01", whose second segment would be a misleading bay/slot value.
 */
export function stripCodeNamespace(rootBins: readonly WarehouseLocation[]): boolean {
  let firstSegment: string | null = null;
  for (const bin of rootBins) {
    const segments = bin.code ? parseCodeSegments(bin.code) : [];
    if (segments.length < 3) return false;
    const segment = segments[0];
    if (firstSegment === null) {
      firstSegment = segment;
    } else if (segment !== firstSegment) {
      return false;
    }
  }
  return firstSegment !== null;
}

/** Plain lexicographic compare — deliberately NOT locale-aware so the
 * layout is byte-identical for every user/locale/session. */
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

interface GroupDraft {
  key: string;
  kind: BinGroup['kind'];
  label: string;
  bins: WarehouseLocation[];
}

function sortBins(bins: WarehouseLocation[]): WarehouseLocation[] {
  return [...bins].sort((a, b) => {
    const codeA = a.code ?? '';
    const codeB = b.code ?? '';
    // Numeric, segment-by-segment ordering keeps live 4-part codes bay-major
    // ("LOC-A-01-01" < "LOC-A-01-02" < "LOC-A-02-01") while also holding for
    // the simple "A-01"/"R10" doc shapes. Mixed shapes fall back to bytes.
    const bySegments = compareByCodeSegments(codeA, codeB) ?? compareText(codeA, codeB);
    if (bySegments !== 0) return bySegments;
    return a.id - b.id;
  });
}

/**
 * Numeric comparator over separator segments of equal-count codes; null when
 * the shapes differ (uneven digit/alpha pattern or segment counts) or a code
 * has no segments — the caller then falls back to byte order.
 */
function compareByCodeSegments(a: string, b: string): number | null {
  const segmentsA = parseCodeSegments(a);
  const segmentsB = parseCodeSegments(b);
  if (segmentsA.length === 0 || segmentsA.length !== segmentsB.length) return null;
  for (let index = 0; index < segmentsA.length; index++) {
    const segA = segmentsA[index];
    const segB = segmentsB[index];
    if (/^\d+$/.test(segA) && /^\d+$/.test(segB)) {
      const diff = Number(segA) - Number(segB);
      if (diff !== 0) return diff;
      // Same value, different padding ("01" vs "1") — stable byte tiebreak.
      const padOrder = compareText(segA, segB);
      if (padOrder !== 0) return padOrder;
    } else {
      const textOrder = compareText(segA, segB);
      if (textOrder !== 0) return textOrder;
    }
  }
  return 0;
}

/**
 * Deterministic auto-layout for one warehouse's bins.
 *
 * Grouping precedence per bin:
 *   1. parent_id — children of the same parent location share a column
 *      (labeled with the parent's code); parents may themselves be bins.
 *   2. leading letters of the bin code — the "aisle" segment ("A-01" → "A");
 *      when ALL root codes share a first segment (live "LOC-…"-style
 *      namespaces), grouping falls to the SECOND segment instead.
 *   3. unsorted — codes without a letter prefix.
 *
 * Groups become columns laid out left-to-right (unsorted last); a group
 * with more than BINS_PER_COLUMN bins wraps into adjacent sub-columns.
 */
export function buildBinLayout(locations: WarehouseLocation[]): BinLayout {
  const byId = new Map<number, WarehouseLocation>(locations.map((loc) => [loc.id, loc]));
  const stripNamespace = stripCodeNamespace(
    locations.filter((loc) => loc.parent_id === null)
  );

  const drafts = new Map<string, GroupDraft>();
  for (const loc of locations) {
    let key: string;
    let kind: BinGroup['kind'];
    let label: string;

    if (loc.parent_id !== null) {
      const parent = byId.get(loc.parent_id);
      key = `parent:${loc.parent_id}`;
      kind = 'parent';
      label = parent?.code ?? `#${loc.parent_id}`;
    } else {
      const aisle = loc.code ? aisleGroupKeyFor(loc.code, stripNamespace) : null;
      if (aisle) {
        key = `aisle:${aisle}`;
        kind = 'aisle';
        label = aisle;
      } else {
        key = 'unsorted';
        kind = 'unsorted';
        label = '';
      }
    }

    const existing = drafts.get(key);
    if (existing) {
      existing.bins.push(loc);
    } else {
      drafts.set(key, { key, kind, label, bins: [loc] });
    }
  }

  // Aisles and parents ordered by label, unsorted always last.
  const ordered = [...drafts.values()].sort((a, b) => {
    if (a.kind === 'unsorted' && b.kind !== 'unsorted') return 1;
    if (b.kind === 'unsorted' && a.kind !== 'unsorted') return -1;
    return compareText(a.label, b.label);
  });

  const bins: PositionedBin[] = [];
  const groups: BinGroup[] = [];
  let cursorX = ORIGIN_X;

  for (const draft of ordered) {
    const sorted = sortBins(draft.bins);
    const columnCount = Math.max(1, Math.ceil(sorted.length / BINS_PER_COLUMN));
    const firstBinY = ORIGIN_Y + GROUP_HEADER_HEIGHT;

    sorted.forEach((loc, index) => {
      const columnIndex = Math.floor(index / BINS_PER_COLUMN);
      const rowInColumn = index % BINS_PER_COLUMN;
      bins.push({
        location: loc,
        groupKey: draft.key,
        slotIndex: index,
        x: cursorX + columnIndex * (BIN_NODE_WIDTH + SUB_GAP_X),
        y: firstBinY + rowInColumn * (BIN_NODE_HEIGHT + BIN_GAP_Y),
      });
    });

    groups.push({
      key: draft.key,
      kind: draft.kind,
      label: draft.label,
      count: sorted.length,
      x: cursorX,
      y: ORIGIN_Y,
    });

    cursorX += columnCount * BIN_NODE_WIDTH + (columnCount - 1) * SUB_GAP_X + GROUP_GAP_X;
  }

  return { bins, groups };
}
