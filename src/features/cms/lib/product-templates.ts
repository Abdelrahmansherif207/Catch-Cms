// ─── Products template metadata (Preset / Custom mode) ───────────
//
// `back.type` selects a server-side products template ("Preset" mode). When
// `type` is null/absent the backend ignores every template rule and the
// section is queried with plain filters ("Custom" mode): different filters
// combine with AND, several values inside one filter combine with OR, and
// `order` (created_at asc/desc) only works in this mode.
//
// Template keys come live from GET /product-type — this module only attaches
// human metadata. Keys missing from the known list render with a humanized
// label in the "Other" group and no description; saved keys are never
// renamed and free-text templates are never offered.

import { formatFieldLabel } from './section-settings';
import type { ProductTypeOption } from '../types/section.types';

export type ProductsDataMode = 'preset' | 'custom';

/** Picker groups in display order. */
export type ProductTemplateGroupId =
  | 'performance'
  | 'discounts'
  | 'flashSales'
  | 'catalog'
  | 'other';

export const PRODUCT_TEMPLATE_GROUPS: {
  id: ProductTemplateGroupId;
  labelKey: string;
}[] = [
  { id: 'performance', labelKey: 'sections.templateGroups.performance' },
  { id: 'discounts', labelKey: 'sections.templateGroups.discounts' },
  { id: 'flashSales', labelKey: 'sections.templateGroups.flashSales' },
  { id: 'catalog', labelKey: 'sections.templateGroups.catalog' },
  { id: 'other', labelKey: 'sections.templateGroups.other' },
];

interface KnownTemplateMeta {
  group: ProductTemplateGroupId;
  labelKey: string;
  descriptionKey: string;
}

const templateKey = (key: string) => `sections.templates.${key}`;

/** Metadata for the known template keys; anything else renders humanized. */
const KNOWN_PRODUCT_TEMPLATES: Record<string, KnownTemplateMeta> = {
  best_product_sales: {
    group: 'performance',
    labelKey: templateKey('best_product_sales') + '.label',
    descriptionKey: templateKey('best_product_sales') + '.description',
  },
  new_arrivals: {
    group: 'performance',
    labelKey: templateKey('new_arrivals') + '.label',
    descriptionKey: templateKey('new_arrivals') + '.description',
  },
  brands_product: {
    group: 'performance',
    labelKey: templateKey('brands_product') + '.label',
    descriptionKey: templateKey('brands_product') + '.description',
  },
  all_product_discounts: {
    group: 'discounts',
    labelKey: templateKey('all_product_discounts') + '.label',
    descriptionKey: templateKey('all_product_discounts') + '.description',
  },
  product_discount_today_or_low_qty: {
    group: 'discounts',
    labelKey: templateKey('product_discount_today_or_low_qty') + '.label',
    descriptionKey: templateKey('product_discount_today_or_low_qty') + '.description',
  },
  flash_sales_product: {
    group: 'flashSales',
    labelKey: templateKey('flash_sales_product') + '.label',
    descriptionKey: templateKey('flash_sales_product') + '.description',
  },
  flash_sales_end_today: {
    group: 'flashSales',
    labelKey: templateKey('flash_sales_end_today') + '.label',
    descriptionKey: templateKey('flash_sales_end_today') + '.description',
  },
  flash_sales_end_week: {
    group: 'flashSales',
    labelKey: templateKey('flash_sales_end_week') + '.label',
    descriptionKey: templateKey('flash_sales_end_week') + '.description',
  },
  product_for_parent_category: {
    group: 'catalog',
    labelKey: templateKey('product_for_parent_category') + '.label',
    descriptionKey: templateKey('product_for_parent_category') + '.description',
  },
};

export interface ProductTemplateInfo {
  /** Original API key — the saved `back.type` value, never renamed. */
  value: string;
  group: ProductTemplateGroupId;
  /** i18n key of the display label; unset for unknown keys. */
  labelKey?: string;
  /** i18n key of the one-line description; unset for unknown keys. */
  descriptionKey?: string;
  /** Humanized key shown for unknown templates. */
  fallbackLabel?: string;
}

/**
 * Maps the live `/product-type` options onto picker metadata. Only keys the
 * API returns are ever offered; unknown keys get a humanized label, the
 * "Other" group and no description.
 */
export function buildProductTemplateOptions(
  options: ProductTypeOption[]
): ProductTemplateInfo[] {
  return options.map((option) => {
    const known = KNOWN_PRODUCT_TEMPLATES[option.value];
    if (known) {
      return {
        value: option.value,
        group: known.group,
        labelKey: known.labelKey,
        descriptionKey: known.descriptionKey,
      };
    }
    return {
      value: option.value,
      group: 'other',
      fallbackLabel: formatFieldLabel(option.value),
    };
  });
}

/** Preset when `type` is set, Custom otherwise (mirrors the backend). */
export function productsModeOf(productType: string | null): ProductsDataMode {
  return productType ? 'preset' : 'custom';
}

/** Back keys a Preset section ignores: every filter, plus Order/OrderPrice. */
export const PRODUCTS_FILTER_KEYS = [
  'productsId',
  'categoriesId',
  'brandsId',
  'promotionsId',
  'flashSalesId',
  'bannersId',
  'couponsId',
] as const;

export const PRODUCTS_PRESET_IGNORED_KEYS: string[] = [
  ...PRODUCTS_FILTER_KEYS,
  'order',
  'order_price',
];

/** Saved back keys a Preset section would ignore (non-empty values only). */
export function ignoredPresetKeys(back: Record<string, unknown>): string[] {
  return PRODUCTS_PRESET_IGNORED_KEYS.filter((key) => {
    const value = back[key];
    if (value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  });
}

/**
 * Reduces a back record to what a Preset section honors: filters, order and
 * order_price are dropped (they are ignored by the template query anyway).
 * Only called on an explicit, confirmed mode switch — plain saves keep the
 * saved record untouched.
 */
export function cleanPresetBack(back: Record<string, unknown>): Record<string, unknown> {
  const next = { ...back };
  for (const key of PRODUCTS_PRESET_IGNORED_KEYS) delete next[key];
  return next;
}
