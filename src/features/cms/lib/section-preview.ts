// ─── Section endpoint preview ────────────────────────────────────
//
// Rebuilds the storefront endpoint a section resolves to from the CURRENT
// editor state, using the same shape the backend writes into the saved
// `endpoint` (e.g. "general/products?type=best_product_sales&limit=8").
//
// Effective params only: products in Preset contribute `type` + `limit`
// (the template query replaces every filter; order/order_price are ignored),
// Custom contributes filters + limit + order. `parent_only` is a no-op for
// categories and `order_price` a no-op everywhere, so neither is sent.
//
// The endpoint string itself is display-only; the live item count is fetched
// with the same query and a small limit (the paginator reports the real
// total regardless of the limit).

export const SECTION_PREVIEW_LIMIT = 4;

/** Storefront paths per section type (create-mode fallback before the
 * backend has generated a saved `endpoint`). */
const STOREFRONT_PATHS: Record<string, string> = {
  products: 'general/products',
  categories: 'general/categories',
  brands: 'general/brands',
  coupons: 'general/coupons',
  banners: 'general/banners',
  'flash-sales': 'general/flash-sales',
  sliders: 'general/sliders',
  promotions: 'general/promotions',
  tags: 'general/tags',
  hero: 'general/hero',
};

/** Path part of a saved endpoint ("general/banner?…" → "general/banner"). */
function savedEndpointPath(savedEndpoint?: string | null): string | undefined {
  if (!savedEndpoint) return undefined;
  const path = savedEndpoint.split('?')[0].trim();
  return path || undefined;
}

function isMeaningful(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

function scalarOf(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function omitKeys(
  record: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (keys.includes(key)) continue;
    next[key] = value;
  }
  return next;
}

/** Flattens a settings record into query entries; arrays use `key[]`. */
function toParamEntries(back: Record<string, unknown>): [string, string][] {
  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(back)) {
    if (!isMeaningful(value)) continue;
    if (Array.isArray(value)) {
      for (const item of value) entries.push([`${key}[]`, scalarOf(item)]);
    } else {
      entries.push([key, scalarOf(value)]);
    }
  }
  return entries;
}

/** Effective query params for one section in its current editor state. */
export function sectionPreviewParams(
  sectionType: string,
  back: Record<string, unknown>,
  productType: string | null
): [string, string][] {
  if (sectionType === 'products') {
    if (productType) {
      // Preset: the template query replaces all filters; only type + limit count.
      const params: [string, string][] = [['type', productType]];
      if (isMeaningful(back.limit)) params.push(['limit', scalarOf(back.limit)]);
      return params;
    }
    // Custom: filters + limit + order. `type: null` is the mode marker, not a
    // query param; `order_price` is a documented backend no-op.
    return toParamEntries(omitKeys(back, ['type', 'order_price']));
  }
  // Other types: the whole back record drives the query; parent_only is a no-op.
  return toParamEntries(omitKeys(back, ['parent_only']));
}

function serializeParams(params: [string, string][]): string {
  return params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
}

/**
 * Builds the endpoint the same way the saved one is built: the path comes
 * from the section's saved `endpoint` (backend ground truth), falling back
 * to the per-type storefront path for not-yet-saved (create mode) sections.
 */
export function buildSectionEndpoint(
  sectionType: string,
  back: Record<string, unknown>,
  productType: string | null,
  savedEndpoint?: string | null
): string {
  const path = savedEndpointPath(savedEndpoint) ?? STOREFRONT_PATHS[sectionType];
  if (!path) return '';
  const query = serializeParams(sectionPreviewParams(sectionType, back, productType));
  return query ? `${path}?${query}` : `${path}?`;
}

/** Same endpoint with a small limit for the cheap item-count call. */
export function withPreviewLimit(endpoint: string, limit: number): string {
  const [path, query = ''] = endpoint.split('?');
  const params = query
    .split('&')
    .filter((part) => part && !part.startsWith('limit='));
  params.push(`limit=${limit}`);
  return `${path}?${params.join('&')}`;
}

/** Reads the paginator total defensively across response shapes. */
export function extractPreviewTotal(payload: unknown): number | null {
  const data = (payload as { data?: unknown } | undefined)?.data;
  if (Array.isArray(data)) return data.length;
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  for (const holder of [record, record.links, record.meta]) {
    const total = (holder as Record<string, unknown> | undefined)?.total;
    if (typeof total === 'number') return total;
  }
  if (Array.isArray(record.data)) return record.data.length;
  return null;
}
