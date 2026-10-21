import type { BinGroup, BinLayout, PositionedBin } from '../types/warehouse-map.types';
import { GROUP_HEADER_HEIGHT } from './layout';
import type { BinPosition } from './map-layout-store';

/**
 * Merges two override layers — EDIT beats SAVED, missing keys fall through.
 */
export function mergePositions(
  saved: ReadonlyMap<number, BinPosition>,
  edited: ReadonlyMap<number, BinPosition>
): Map<number, BinPosition> {
  return new Map([...saved, ...edited]);
}

/**
 * Pure re-coordinate of an auto layout: each bin takes its override position
 * when present (saved or in-edit), everything else keeps the auto spot.
 * Group labels are RE-DERIVED from their members (min x / min y − header
 * height) so an aisle header always rides along wherever its bins go —
 * they can never drift away from the bins they caption.
 */
export function withOverrides(
  layout: BinLayout,
  overrides: ReadonlyMap<number, BinPosition>
): BinLayout {
  const bins: PositionedBin[] = layout.bins.map((bin) => {
    const override = overrides.get(bin.location.id);
    return override ? { ...bin, x: override.x, y: override.y } : bin;
  });

  const minXByGroup = new Map<string, number>();
  const minYByGroup = new Map<string, number>();
  for (const bin of bins) {
    const minX = minXByGroup.get(bin.groupKey);
    if (minX === undefined || bin.x < minX) minXByGroup.set(bin.groupKey, bin.x);
    const minY = minYByGroup.get(bin.groupKey);
    if (minY === undefined || bin.y < minY) minYByGroup.set(bin.groupKey, bin.y);
  }

  const groups: BinGroup[] = layout.groups.map((group) => {
    const minX = minXByGroup.get(group.key);
    const minY = minYByGroup.get(group.key);
    if (minX === undefined || minY === undefined) return group;
    return { ...group, x: minX, y: minY - GROUP_HEADER_HEIGHT };
  });

  return { bins, groups };
}

/**
 * Translation helper for group-header drags: returns the member bins of one
 * group as a plain array (stable order) so the page can translate them all
 * by the same delta.
 */
export function binsOfGroup(layout: BinLayout, groupKey: string): PositionedBin[] {
  return layout.bins.filter((bin) => bin.groupKey === groupKey);
}
