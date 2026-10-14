import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { STORAGE_KEYS } from '@/shared/constants/api';

/**
 * Release-selection state for the orders board, persisted in localStorage so
 * a refresh or connectivity loss does not lose the operator's basket of
 * orders awaiting release to fulfillment.
 *
 * Storage shape: JSON array of integer order ids under
 * `STORAGE_KEYS.RELEASE_SELECTION`. The max-100 cap mirrors the backend
 * `order_ids.max:100` rule — adding beyond the cap is refused with a toast.
 */
const MAX_SELECTION = 100;

function readStoredIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RELEASE_SELECTION);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is number =>
        typeof value === 'number' && Number.isInteger(value) && value >= 1
    );
  } catch {
    return [];
  }
}

function writeStoredIds(ids: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RELEASE_SELECTION, JSON.stringify(ids));
  } catch {
    // Storage may be unavailable (private mode / quota) — selection still
    // works for the session, it just won't survive a refresh.
  }
}

export function useReleaseSelection(): {
  selected: Set<number>;
  isSelected: (id: number) => boolean;
  toggle: (id: number) => void;
  toggleMany: (ids: number[]) => void;
  restore: (ids: number[]) => void;
  clearSelected: (ids?: number[]) => void;
  clearAll: () => void;
} {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(readStoredIds())
  );

  // Persist on every change; read-only mirrors the hook state.
  useEffect(() => {
    writeStoredIds([...selected]);
  }, [selected]);

  const isSelected = useCallback((id: number) => selected.has(id), [selected]);

  const toggle = useCallback(
    (id: number) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          return next;
        }
        if (next.size >= MAX_SELECTION) {
          toast.error(t('fulfillments.releaseSelectionCap', { max: MAX_SELECTION }));
          return prev;
        }
        next.add(id);
        return next;
      });
    },
    [t]
  );

  const toggleMany = useCallback(
    (ids: number[]) => {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          if (next.has(id)) continue;
          if (next.size >= MAX_SELECTION) {
            toast.error(t('fulfillments.releaseSelectionCap', { max: MAX_SELECTION }));
            break;
          }
          next.add(id);
        }
        return next.size === prev.size && ids.every((id) => prev.has(id))
          ? new Set([...prev].filter((id) => !ids.includes(id)))
          : next;
      });
    },
    [t]
  );

  const restore = useCallback((ids: number[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  /** Removes ids from the selection (e.g. successfully released ones). */
  const clearSelected = useCallback((ids?: number[]) => {
    setSelected((prev) => {
      if (!ids) return new Set<number>();
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setSelected(new Set<number>()), []);

  return {
    selected,
    isSelected,
    toggle,
    toggleMany,
    restore,
    clearSelected,
    clearAll,
  };
}

export const RELEASE_SELECTION_MAX = MAX_SELECTION;
