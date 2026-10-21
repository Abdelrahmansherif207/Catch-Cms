/**
 * Layout persistence — localStorage adapter (v1: per-browser, per-user device).
 *
 * The signature is deliberately endpoint-shaped: when the backend ships the
 * map-layout contract (GET/PUT /admin/warehouses/{id}/map-layout — see
 * updateDocs/warehouse-map-layout-editor-2026-10-20.md), these three
 * functions swap to API calls and NOTHING else in the feature changes.
 */

const STORAGE_PREFIX = 'warehouse-map-v1:layout:';

export interface BinPosition {
  x: number;
  y: number;
}

interface StoredLayout {
  version: 1;
  updatedAt: string;
  /** Keys are bin ids (localStorage JSON keys are always strings). */
  positions: Record<string, BinPosition>;
}

function keyFor(warehouseId: number): string {
  return `${STORAGE_PREFIX}${warehouseId}`;
}

function parseStored(raw: string): Map<number, BinPosition> {
  const parsed = JSON.parse(raw) as Partial<StoredLayout> | null;
  const positions = new Map<number, BinPosition>();
  if (!parsed || parsed.version !== 1 || typeof parsed.positions !== 'object' || parsed.positions === null) {
    return positions;
  }
  for (const [id, position] of Object.entries(parsed.positions)) {
    const binId = Number(id);
    if (!Number.isInteger(binId) || binId <= 0) continue;
    if (
      typeof position === 'object' &&
      position !== null &&
      typeof position.x === 'number' &&
      typeof position.y === 'number' &&
      Number.isFinite(position.x) &&
      Number.isFinite(position.y)
    ) {
      positions.set(binId, { x: position.x, y: position.y });
    }
  }
  return positions;
}

/** Saved overrides for one warehouse — empty map when none / unreadable / stale version. */
export function loadLayout(warehouseId: number): Map<number, BinPosition> {
  try {
    const raw = window.localStorage.getItem(keyFor(warehouseId));
    return raw ? parseStored(raw) : new Map();
  } catch {
    // quota errors, privacy mode, corrupted JSON — degrade to auto layout.
    return new Map();
  }
}

/** Persists the FULL effective positions of a warehouse (≤100 bins — tiny JSON). */
export function saveLayout(warehouseId: number, positions: ReadonlyMap<number, BinPosition>): void {
  const stored: StoredLayout = {
    version: 1,
    updatedAt: new Date().toISOString(),
    positions: Object.fromEntries([...positions].map(([binId, position]) => [String(binId), position])),
  };
  try {
    window.localStorage.setItem(keyFor(warehouseId), JSON.stringify(stored));
  } catch {
    // Storage unavailable — in-memory state keeps working for this session.
  }
}

/** Back to the pure auto layout (confirm gate lives in the UI). */
export function clearLayout(warehouseId: number): void {
  try {
    window.localStorage.removeItem(keyFor(warehouseId));
  } catch {
    // nothing persisted — nothing to undo.
  }
}
