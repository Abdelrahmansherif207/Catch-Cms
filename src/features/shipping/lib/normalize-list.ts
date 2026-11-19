import type { PaginatedResponse } from '../types/shipping.types';

export interface NormalizedList<T> {
  items: T[];
  pagination?: PaginatedResponse<T>;
}

/**
 * The shipping endpoints may return either a Laravel paginator
 * (`{ data: { data: T[], current_page, ... } }`) or a flat array
 * (`{ data: T[] }`). Normalize both shapes so pages always get items.
 */
export function normalizeShippingList<T>(
  raw: PaginatedResponse<T> | T[] | null | undefined,
): NormalizedList<T> {
  if (!raw) return { items: [] };
  if (Array.isArray(raw)) return { items: raw };
  return { items: raw.data ?? [], pagination: raw };
}
