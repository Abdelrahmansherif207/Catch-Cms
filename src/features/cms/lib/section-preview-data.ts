// ─── Section preview data ────────────────────────────────────────
//
// Normalizes the storefront payloads fetched by the section editor preview
// into small, display-ready cards. Payload shapes differ per endpoint:
// products answer with `{ data: [...] }` (the documented paginator nests them
// under `data.products`), categories with `{ data: { data: [...], links } }`
// (older responses may use a top-level `meta`), and brands/coupons with a
// plain `data` array.
//
// Totals are only trusted from paginator metadata. A bare array never proves
// it is the whole result, so its length is treated as "at least N" by the
// caption helper instead of an exact total.

import type { Language } from '@/shared/constants/api';

export type SectionPreviewType = 'products' | 'categories' | 'brands' | 'coupons';

/** The preview never requests more than this many cards per check. */
export const SECTION_PREVIEW_MAX_ITEMS = 12;

export interface PreviewProductCard {
  kind: 'product';
  id: string;
  name: string;
  image: string | null;
  price: number | null;
  originalPrice: number | null;
  currency: string | null;
}

export interface PreviewEntityCard {
  kind: 'category' | 'brand';
  id: string;
  name: string;
  image: string | null;
}

export interface PreviewCouponCard {
  kind: 'coupon';
  id: string;
  name: string;
  code: string;
  value: string;
}

export type PreviewCard =
  | PreviewProductCard
  | PreviewEntityCard
  | PreviewCouponCard;

export interface SectionPreviewData {
  items: PreviewCard[];
  /** Exact total from paginator metadata, or null when the endpoint omits it. */
  total: number | null;
  /** Raw number of items received (before any malformed entries are dropped). */
  receivedCount: number;
}

export interface PreviewMatchState {
  /** Count shown in the caption (exact total, or the received count). */
  count: number;
  /** True when the received count reached the request limit without a total. */
  isAtLeast: boolean;
  /** True when more results exist beyond what is rendered. */
  isTruncated: boolean;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** Reads a total from a value that is either a number or a `{ total }` holder. */
function readTotal(...sources: unknown[]): number | null {
  for (const source of sources) {
    const direct = toNumber(source);
    if (direct !== null) return direct;
    if (isRecord(source)) {
      const nested = toNumber(source.total);
      if (nested !== null) return nested;
    }
  }
  return null;
}

interface UnwrappedPayload {
  list: unknown[];
  total: number | null;
}

export function unwrapSectionPreviewPayload(payload: unknown): UnwrappedPayload {
  if (Array.isArray(payload)) return { list: payload, total: null };
  if (!isRecord(payload)) return { list: [], total: null };

  const data = payload.data;
  const topLevelTotal = readTotal(payload, payload.meta, payload.links);

  if (Array.isArray(data)) {
    return { list: data, total: topLevelTotal };
  }

  if (isRecord(data)) {
    // Documented products shape: { data: { products: { data, links } } }.
    const products = data.products;
    if (isRecord(products) && Array.isArray(products.data)) {
      return {
        list: products.data,
        total:
          readTotal(products, products.links, products.meta) ?? topLevelTotal,
      };
    }
    if (Array.isArray(products)) {
      return {
        list: products,
        total: readTotal(data, data.links, data.meta) ?? topLevelTotal,
      };
    }
    // Nested paginator: { data: { data: [...], links/meta/total } }.
    if (Array.isArray(data.data)) {
      return {
        list: data.data,
        total: readTotal(data, data.links, data.meta) ?? topLevelTotal,
      };
    }
  }

  return { list: [], total: topLevelTotal };
}

// ─── Text & image normalization ─────────────────────────────────

function pickLocalized(record: UnknownRecord, language: Language): string {
  const keys: Language[] = language === 'ar' ? ['ar', 'en'] : ['en', 'ar'];
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
}

/** Accepts plain strings, JSON-encoded locale maps and `{ en, ar }` objects. */
export function resolvePreviewName(
  value: unknown,
  language: Language
): string {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return '';
    if (text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (isRecord(parsed)) {
          const localized = pickLocalized(parsed, language);
          if (localized) return localized;
        }
      } catch {
        // Not JSON — use the string as-is.
      }
    }
    return text;
  }
  if (isRecord(value)) return pickLocalized(value, language);
  return '';
}

function imageUrlOf(value: unknown): string | null {
  if (typeof value === 'string') {
    const text = value.trim();
    return text || null;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const url = imageUrlOf(entry);
      if (url) return url;
    }
    return null;
  }
  if (isRecord(value)) {
    // Prefer the original/largest rendition, then the common named fields.
    for (const key of [
      'original',
      'url',
      'desktop',
      'mobile',
      'thumbnail',
      'src',
      'path',
    ]) {
      const url = imageUrlOf(value[key]);
      if (url) return url;
    }
    // Locale/variant maps look like { "1x": "https://…" }.
    for (const nested of Object.values(value)) {
      if (typeof nested === 'string' && /^(https?:|\/|data:)/i.test(nested.trim())) {
        return nested.trim();
      }
    }
  }
  return null;
}

function firstImageUrl(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    const url = imageUrlOf(candidate);
    if (url) return url;
  }
  return null;
}

function idOf(item: UnknownRecord, index: number): string {
  const raw = item.id ?? item.slug;
  if (raw !== null && raw !== undefined) {
    const text = String(raw).trim();
    if (text) return text;
  }
  return `preview-${index}`;
}

function currencyOf(item: UnknownRecord): string | null {
  const value = item.currency;
  if (typeof value === 'string' && value.trim()) return value.trim().toUpperCase();
  if (isRecord(value)) {
    const code = value.code;
    if (typeof code === 'string' && code.trim()) return code.trim().toUpperCase();
  }
  const fallback = item.currency_code;
  if (typeof fallback === 'string' && fallback.trim()) {
    return fallback.trim().toUpperCase();
  }
  return null;
}

// ─── Formatting helpers ─────────────────────────────────────────

function resolveLocale(language: Language): string {
  return language === 'ar' ? 'ar' : 'en';
}

export function formatPreviewNumber(value: number, language: Language): string {
  try {
    return new Intl.NumberFormat(resolveLocale(language)).format(value);
  } catch {
    return String(value);
  }
}

export function formatPreviewAmount(
  value: number,
  currency: string | null,
  language: Language
): string {
  const locale = resolveLocale(language);
  if (currency) {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      // Invalid/unsupported currency code — fall through to a plain number.
    }
  }
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  } catch {
    return String(value);
  }
}

// ─── Card mappers ───────────────────────────────────────────────

function productPrices(item: UnknownRecord): {
  price: number | null;
  originalPrice: number | null;
} {
  const base = toNumber(item.price);
  const current = toNumber(item.current_price);
  const discounted = toNumber(item.price_after_discount);
  const flash = toNumber(item.price_after_flash_sale);

  // Mirrors the storefront's `toProductItem`: a flash-sale price wins,
  // otherwise `current_price` (already discounted when a discount is active),
  // then the discounted/base price, then the base price.
  const price = flash ?? current ?? discounted ?? base;

  const originalPrice =
    base !== null && price !== null && base > price ? base : null;

  return { price, originalPrice };
}

function couponValue(item: UnknownRecord, language: Language): string {
  const raw = item.discount;
  if (raw === null || raw === undefined || raw === '') return '';

  const discountType =
    typeof item.discount_type === 'string'
      ? item.discount_type.toLowerCase()
      : '';
  if (discountType.includes('percent')) {
    const amount = toNumber(raw);
    if (amount !== null) return `${formatPreviewNumber(amount, language)}%`;
    const text = String(raw).trim();
    return text.endsWith('%') ? text : `${text}%`;
  }

  const amount = toNumber(raw);
  if (amount === null) return String(raw).trim();
  return formatPreviewAmount(amount, currencyOf(item), language);
}

function toPreviewCard(
  entry: unknown,
  type: SectionPreviewType,
  language: Language,
  index: number
): PreviewCard | null {
  if (!isRecord(entry)) return null;

  const id = idOf(entry, index);
  const name =
    resolvePreviewName(entry.name, language) ||
    resolvePreviewName(entry.title, language) ||
    resolvePreviewName(entry.code, language);

  if (type === 'products') {
    const { price, originalPrice } = productPrices(entry);
    return {
      kind: 'product',
      id,
      name,
      image: firstImageUrl(entry.images, entry.image),
      price,
      originalPrice,
      currency: currencyOf(entry),
    };
  }

  if (type === 'coupons') {
    const code = resolvePreviewName(entry.code, language);
    return {
      kind: 'coupon',
      id,
      name: name || code,
      code: code || name,
      value: couponValue(entry, language),
    };
  }

  return {
    kind: type === 'categories' ? 'category' : 'brand',
    id,
    name: name || resolvePreviewName(entry.slug, language),
    image: firstImageUrl(entry.image, entry.logo),
  };
}

export function normalizeSectionPreview(
  payload: unknown,
  type: SectionPreviewType,
  language: Language
): SectionPreviewData {
  const { list, total } = unwrapSectionPreviewPayload(payload);
  const items = list
    .map((entry, index) => toPreviewCard(entry, type, language, index))
    .filter((card): card is PreviewCard => card !== null);

  // Defensive: a paginator total smaller than the received page is wrong.
  const safeTotal = total === null ? null : Math.max(total, list.length);

  return { items, total: safeTotal, receivedCount: list.length };
}

/**
 * Caption counts. With an exact total, `isTruncated` tells whether the preview
 * stopped before the end. Without one, the received count is only exact when
 * it came back short of the request limit; otherwise it is "N or more".
 */
export function resolvePreviewMatch(
  total: number | null,
  receivedCount: number,
  requestLimit: number
): PreviewMatchState {
  if (total !== null) {
    return {
      count: total,
      isAtLeast: false,
      isTruncated: total > requestLimit,
    };
  }

  if (receivedCount === 0) {
    return { count: 0, isAtLeast: false, isTruncated: false };
  }

  const isAtLeast = receivedCount >= requestLimit;
  return { count: receivedCount, isAtLeast, isTruncated: isAtLeast };
}
