// ─── Section settings field system ───────────────────────────────
//
// Single source of truth for rendering every `setting.front` / `setting.back`
// key in the section editor. A field spec comes from (in order of
// precedence for its content, all merged into one list):
//
//   1. the backend settings template (`GET /section-types/{type}/settings`)
//   2. the per-type fallback registry below (keys the template may omit)
//   3. any remaining key found in the section's saved data (safety net —
//      a key that is live on the storefront can never be invisible here)
//
// The template value may be either a plain default value (current backend
// shape) or an enriched spec object `{ type: "localized", options: [...] }`
// (see `isFieldSpec`) so the backend can take over per-field metadata in
// the future without another frontend change.

export type FieldKind =
  | 'boolean'
  | 'number'
  | 'string'
  | 'localized'
  | 'select'
  | 'order'
  | 'date'
  | 'datetime'
  | 'ids';

/**
 * Editor tab a settings field renders in. Tabs span the whole Edit Section
 * form: `general` (section identity + copy), `content` (back/query settings),
 * `layout` (display geometry), `media` (hero media only), `extras` (badge,
 * timer, view-all, CTA, counts) and `advanced` (declared legacy flags plus
 * undeclared saved keys, read-only).
 */
export type FieldGroup =
  | 'general'
  | 'content'
  | 'layout'
  | 'media'
  | 'extras'
  | 'advanced';

/** Canonical tab order for rendering field groups. */
export const FIELD_GROUP_ORDER: FieldGroup[] = [
  'general',
  'content',
  'layout',
  'media',
  'extras',
  'advanced',
];

export type LocalizedValue = Partial<Record<'en' | 'ar', string>> & Record<string, unknown>;

export interface SettingsFieldSpec {
  key: string;
  kind: FieldKind;
  /** Allowed values, for kind === 'select'. */
  options?: string[];
  /** i18n key for the field label; falls back to a derived label. */
  labelKey?: string;
  min?: number;
  max?: number;
  step?: number;
  /**
   * Storefront fallback when the key is unset. Display-only: the editor shows
   * the effective value but never writes it unless the user edits the field.
   */
  defaultValue?: unknown;
  /** Editor tab for this field; unset keys derive one in mergeSettingsFields. */
  group?: FieldGroup;
}

// ─── Localized { en, ar } helpers ─────────────────────────────────

export function isLocalizedValue(value: unknown): value is LocalizedValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(record, 'en')
    || Object.prototype.hasOwnProperty.call(record, 'ar');
}

/**
 * Normalizes any saved value into editable `{ en, ar }` strings.
 *
 * Older sections may store a plain string (e.g. `badge_text: "low stock"`).
 * The storefront resolves it for every locale, so it is shown in both inputs
 * instead of rendering an empty control.
 */
export function toLocalizedDraft(value: unknown): { en: string; ar: string } {
  if (isLocalizedValue(value)) {
    return {
      en: typeof value.en === 'string' ? value.en : '',
      ar: typeof value.ar === 'string' ? value.ar : '',
    };
  }
  if (typeof value === 'string') {
    return { en: value, ar: value };
  }
  return { en: '', ar: '' };
}

/** Builds the stored shape from editable draft strings (keeps extra keys). */
export function fromLocalizedDraft(
  current: unknown,
  next: { en: string; ar: string }
): LocalizedValue {
  const base: LocalizedValue = isLocalizedValue(current)
    ? { ...(current as LocalizedValue) }
    : {};
  return { ...base, en: next.en, ar: next.ar };
}

// ─── Enriched template spec detection ────────────────────────────

const ALL_KINDS: FieldKind[] = [
  'boolean', 'number', 'string', 'localized', 'select', 'order', 'date', 'datetime', 'ids',
];

const SPEC_KEYS = new Set(['type', 'options', 'label', 'min', 'max', 'step', 'default']);

interface EnrichedSpec {
  type: FieldKind;
  options?: string[];
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  default?: unknown;
}

function isFieldSpec(value: unknown): value is EnrichedSpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.type !== 'string' || !ALL_KINDS.includes(record.type as FieldKind)) {
    return false;
  }
  return Object.keys(record).every((key) => SPEC_KEYS.has(key));
}

// ─── Kind inference from a plain (untyped) template value ────────

/** Shelf layout options shared by products, banners, sliders, flash sales. */
const SHELF_LAYOUT_OPTIONS = ['grid', 'list', 'slider'];
/** Categories only render a grid or the legacy rail. */
const CATEGORY_LAYOUT_OPTIONS = ['grid', 'slider'];
/** Brands render a grid or a compact list; there is no rail. */
const BRANDS_LAYOUT_OPTIONS = ['grid', 'list'];
/** CatchTagsSection accepts these tones. */
const TAG_TONE_OPTIONS = ['dark', 'light', 'berry'];

/** Enum options we know about today; replaced by template specs in phase 2. */
const KEY_SELECT_OPTIONS: Record<string, string[]> = {
  media_type: ['image', 'video'],
  shape: ['square', 'circle'],
  layout: SHELF_LAYOUT_OPTIONS,
  theme: ['dark', 'light', 'colorful'],
  tone: ['light', 'dark'],
};

/** Existing i18n labels; new keys fall back to a derived label. */
const KEY_LABEL_I18N: Record<string, string> = {
  action_href: 'sections.actionHref',
  action_label: 'sections.actionLabel',
  autoplay: 'sections.autoplay',
  badge_text: 'sections.badgeText',
  balance_last_row: 'sections.balanceLastRow',
  categoriesId: 'sections.categories',
  columns_count: 'sections.columnsCount',
  cta_href: 'sections.ctaHref',
  cta_label: 'sections.ctaLabel',
  eyebrow: 'sections.eyebrow',
  heading: 'sections.heading',
  image_desktop: 'sections.imageDesktop',
  image_mobile: 'sections.imageMobile',
  layout: 'sections.layout',
  limit: 'sections.limit',
  loop: 'sections.loop',
  media_type: 'sections.mediaType',
  mobile_columns_count: 'sections.mobileColumnsCount',
  mobile_rows_count: 'sections.mobileRowsCount',
  muted: 'sections.muted',
  order: 'sections.order',
  parent: 'sections.parentFlag',
  poster: 'sections.poster',
  rows_count: 'sections.rowsCount',
  show_cta: 'sections.showCta',
  show_hashtag: 'sections.showHashtag',
  show_mobile_content: 'sections.showMobileContent',
  show_overlay: 'sections.showOverlay',
  show_product_count: 'sections.showProductCount',
  show_timer: 'sections.showTimer',
  show_title: 'sections.showTitle',
  show_view_all: 'sections.showViewAll',
  slider_speed: 'sections.sliderSpeed',
  subtitle: 'sections.subtitle',
  tablet_columns_count: 'sections.tabletColumnsCount',
  tablet_rows_count: 'sections.tabletRowsCount',
  theme: 'sections.theme',
  timer_end_at: 'sections.timerEndAt',
  tone: 'sections.tone',
  video_desktop: 'sections.videoDesktop',
  video_mobile: 'sections.videoMobile',
};

// ─── Field groups (editor tabs) ──────────────────────────────────
//
// Fallback group per key, used when no registry entry declares one. Back
// settings always land in `content` ("everything saved under back"); unknown
// front keys fall back to `extras`; unknown saved-data keys always go to
// `advanced` (Other Settings).

const KEY_GROUP: Record<string, FieldGroup> = {
  action_href: 'extras',
  action_label: 'extras',
  autoplay: 'layout',
  badge_text: 'extras',
  columns_count: 'layout',
  cta_href: 'extras',
  cta_label: 'extras',
  eyebrow: 'general',
  heading: 'general',
  image_desktop: 'media',
  image_mobile: 'media',
  layout: 'layout',
  media_type: 'media',
  mobile_columns_count: 'layout',
  mobile_rows_count: 'layout',
  poster: 'media',
  rows_count: 'layout',
  show_cta: 'extras',
  show_hashtag: 'general',
  show_mobile_content: 'layout',
  show_overlay: 'media',
  show_product_count: 'extras',
  show_timer: 'extras',
  show_title: 'general',
  show_view_all: 'extras',
  slider_speed: 'layout',
  subtitle: 'general',
  tablet_columns_count: 'layout',
  tablet_rows_count: 'layout',
  timer_end_at: 'extras',
  tone: 'layout',
  video_desktop: 'media',
  video_mobile: 'media',
};

/** Per-type overrides where a key's group differs from KEY_GROUP. */
const TYPE_KEY_GROUP: Record<string, Record<string, FieldGroup>> = {
  hero: { autoplay: 'media', loop: 'media', muted: 'media' },
};

export function inferKind(key: string, templateValue: unknown, currentValue: unknown): FieldKind {
  // `order_price` is no longer mapped: it is a documented-but-unconsumed
  // backend parameter and is hidden from the form entirely (see
  // GLOBALLY_HIDDEN_BACK_KEYS in dynamic-settings-form.tsx).
  if (key === 'order') return 'order';
  if (key === 'start_date' || key === 'end_date') return 'date';
  if (key === 'timer_end_at' || key.endsWith('_at')) return 'datetime';
  if (key.endsWith('Id') || key.endsWith('Id[]') || key.endsWith('Ids[]') || key.endsWith('Ids')) {
    return 'ids';
  }
  if (!isFieldSpec(templateValue)) {
    if (isLocalizedValue(templateValue) || isLocalizedValue(currentValue)) return 'localized';
    if (typeof templateValue === 'boolean' || typeof currentValue === 'boolean') return 'boolean';
    if (typeof templateValue === 'number' || typeof currentValue === 'number') return 'number';
  }
  return 'string';
}

/**
 * Keys the editor must always treat as localized `{ en, ar }` values, no
 * matter what a template spec or stored value suggests. Older data may hold a
 * plain string (e.g. banners `badge_text: "low stock"`); both shapes are read,
 * and editing always writes the object back.
 */
const FORCED_LOCALIZED_KEYS = new Set(['badge_text']);

export function normalizeFieldSpec(
  key: string,
  templateValue: unknown,
  currentValue: unknown
): SettingsFieldSpec {
  const spec = isFieldSpec(templateValue) ? templateValue : null;
  const inferredKind = spec?.type ?? inferKind(key, templateValue, currentValue);
  const options = spec?.options ?? KEY_SELECT_OPTIONS[key];
  // A declared (or registry-known) option list makes the field a dropdown
  // even when its stored value is a plain string.
  const kind: FieldKind = FORCED_LOCALIZED_KEYS.has(key)
    ? 'localized'
    : inferredKind === 'string' && options && options.length > 0
      ? 'select'
      : inferredKind;
  const labelKey = KEY_LABEL_I18N[key];
  const entry: SettingsFieldSpec = { key, kind };
  if (options) entry.options = options;
  if (labelKey) entry.labelKey = labelKey;
  if (spec?.min !== undefined) entry.min = spec.min;
  if (spec?.max !== undefined) entry.max = spec.max;
  if (spec?.step !== undefined) entry.step = spec.step;
  if (spec?.default !== undefined) entry.defaultValue = spec.default;
  return entry;
}

// ─── Per-type fallback registry ──────────────────────────────────
//
// Covers every key the editor must offer even when the backend template
// omits it — kept group-aware so display keys never leak into "Data
// Settings". The template list is merged first, so registry entries only
// fill gaps — the two never fight for the same key.

interface TypeFieldRegistry {
  front: SettingsFieldSpec[];
  back: SettingsFieldSpec[];
}

const COLUMNS = (max?: number): SettingsFieldSpec => ({
  key: 'columns_count',
  kind: 'number',
  labelKey: 'sections.columnsCount',
  min: 1,
  max,
});

export const SECTION_FIELD_FALLBACKS: Record<string, TypeFieldRegistry> = {
  hero: {
    // Media paths (video_*, poster, image_*) are edited by HeroMediaPicker,
    // not in the generic grid. They are listed in INLINE_FRONT_KEYS.
    front: [
      { key: 'media_type', kind: 'select', group: 'media', options: KEY_SELECT_OPTIONS.media_type, labelKey: 'sections.mediaType', defaultValue: 'video' },
      { key: 'eyebrow', kind: 'localized', group: 'general', labelKey: 'sections.eyebrow' },
      { key: 'heading', kind: 'localized', group: 'general', labelKey: 'sections.heading' },
      { key: 'subtitle', kind: 'localized', group: 'general', labelKey: 'sections.subtitle' },
      { key: 'cta_label', kind: 'localized', group: 'extras', labelKey: 'sections.ctaLabel' },
      { key: 'cta_href', kind: 'string', group: 'extras', labelKey: 'sections.ctaHref' },
      { key: 'show_cta', kind: 'boolean', group: 'extras', labelKey: 'sections.showCta', defaultValue: true },
      { key: 'show_overlay', kind: 'boolean', group: 'media', labelKey: 'sections.showOverlay', defaultValue: true },
      // Accepted values mirror CatchHeroSection.tsx (storefront source of truth).
      { key: 'content_align', kind: 'select', group: 'layout', options: ['start', 'center', 'end'], labelKey: 'sections.contentAlign', defaultValue: 'center' },
      { key: 'content_position', kind: 'select', group: 'layout', options: ['center', 'bottom'], labelKey: 'sections.contentPosition', defaultValue: 'center' },
      { key: 'height', kind: 'select', group: 'layout', options: ['compact', 'standard', 'tall'], labelKey: 'sections.height', defaultValue: 'standard' },
      { key: 'show_mobile_content', kind: 'boolean', group: 'layout', labelKey: 'sections.showMobileContent' },
      { key: 'tone', kind: 'select', group: 'layout', options: KEY_SELECT_OPTIONS.tone, labelKey: 'sections.tone', defaultValue: 'light' },
      { key: 'autoplay', kind: 'boolean', group: 'media', labelKey: 'sections.autoplay', defaultValue: true },
      { key: 'loop', kind: 'boolean', group: 'media', labelKey: 'sections.loop', defaultValue: true },
      { key: 'muted', kind: 'boolean', group: 'media', labelKey: 'sections.muted', defaultValue: true },
    ],
    back: [],
  },
  sliders: {
    front: [
      COLUMNS(),
      { key: 'layout', kind: 'select', group: 'layout', options: SHELF_LAYOUT_OPTIONS, labelKey: 'sections.layout', defaultValue: 'slider' },
      { key: 'autoplay', kind: 'boolean', group: 'layout', labelKey: 'sections.autoplay' },
      { key: 'slider_speed', kind: 'number', group: 'layout', labelKey: 'sections.sliderSpeed', min: 500, step: 500 },
    ],
    back: [],
  },
  promotions: {
    // CatchPromotionsSection renders a fixed two-column grid; column/layout/
    // slider settings are no-ops, so the editor only offers consumed copy keys.
    front: [
      { key: 'subtitle', kind: 'localized', group: 'general', labelKey: 'sections.subtitle' },
      { key: 'show_title', kind: 'boolean', group: 'general', labelKey: 'sections.showTitle', defaultValue: true },
    ],
    back: [],
  },
  'flash-sales': {
    front: [
      COLUMNS(),
      { key: 'layout', kind: 'select', group: 'layout', options: SHELF_LAYOUT_OPTIONS, labelKey: 'sections.layout', defaultValue: 'slider' },
      { key: 'subtitle', kind: 'localized', group: 'general', labelKey: 'sections.subtitle' },
      { key: 'show_title', kind: 'boolean', group: 'general', labelKey: 'sections.showTitle', defaultValue: true },
      { key: 'badge_text', kind: 'localized', group: 'extras', labelKey: 'sections.badgeText' },
      { key: 'show_timer', kind: 'boolean', group: 'extras', labelKey: 'sections.showTimer' },
      { key: 'timer_end_at', kind: 'datetime', group: 'extras', labelKey: 'sections.timerEndAt' },
    ],
    back: [],
  },
  coupons: {
    // The coupon grid derives its own full/half layout from the coupon count.
    front: [
      { key: 'subtitle', kind: 'localized', group: 'general', labelKey: 'sections.subtitle' },
      { key: 'show_title', kind: 'boolean', group: 'general', labelKey: 'sections.showTitle', defaultValue: true },
    ],
    back: [],
  },
  brands: {
    front: [
      COLUMNS(),
      { key: 'layout', kind: 'select', group: 'layout', options: BRANDS_LAYOUT_OPTIONS, labelKey: 'sections.layout', defaultValue: 'grid' },
      { key: 'subtitle', kind: 'localized', group: 'general', labelKey: 'sections.subtitle' },
      { key: 'show_title', kind: 'boolean', group: 'general', labelKey: 'sections.showTitle', defaultValue: true },
      { key: 'show_view_all', kind: 'boolean', group: 'extras', labelKey: 'sections.showViewAll', defaultValue: true },
      { key: 'action_label', kind: 'localized', group: 'extras', labelKey: 'sections.actionLabel' },
      { key: 'action_href', kind: 'string', group: 'extras', labelKey: 'sections.actionHref' },
    ],
    back: [],
  },
  categories: {
    front: [
      // Mirrors the storefront SectionFrontSetting contract. `shape` is
      // rendered by SectionTypeConfig (preview panel), not in this list.
      { key: 'show_product_count', kind: 'boolean', group: 'extras', labelKey: 'sections.showProductCount' },
      { key: 'columns_count', kind: 'number', group: 'layout', labelKey: 'sections.columnsCount', min: 2, max: 8 },
      { key: 'layout', kind: 'select', group: 'layout', options: CATEGORY_LAYOUT_OPTIONS, labelKey: 'sections.layout', defaultValue: 'grid' },
      { key: 'rows_count', kind: 'number', group: 'layout', labelKey: 'sections.rowsCount', min: 1, max: 4 },
      { key: 'tablet_columns_count', kind: 'number', group: 'layout', labelKey: 'sections.tabletColumnsCount', min: 2, max: 6 },
      { key: 'tablet_rows_count', kind: 'number', group: 'layout', labelKey: 'sections.tabletRowsCount', min: 1, max: 4 },
      { key: 'mobile_columns_count', kind: 'number', group: 'layout', labelKey: 'sections.mobileColumnsCount', min: 2, max: 4 },
      { key: 'mobile_rows_count', kind: 'number', group: 'layout', labelKey: 'sections.mobileRowsCount', min: 1, max: 4 },
      { key: 'subtitle', kind: 'localized', group: 'general', labelKey: 'sections.subtitle' },
      { key: 'show_title', kind: 'boolean', group: 'general', labelKey: 'sections.showTitle', defaultValue: true },
      { key: 'show_view_all', kind: 'boolean', group: 'extras', labelKey: 'sections.showViewAll', defaultValue: true },
      { key: 'action_label', kind: 'localized', group: 'extras', labelKey: 'sections.actionLabel' },
      { key: 'action_href', kind: 'string', group: 'extras', labelKey: 'sections.actionHref' },
    ],
    back: [
      { key: 'limit', kind: 'number', group: 'content', labelKey: 'sections.limit', min: 1 },
      { key: 'categoriesId', kind: 'ids', group: 'content', labelKey: 'sections.categories' },
      { key: 'order', kind: 'order', group: 'content', labelKey: 'sections.order' },
      // Legacy query flags under their saved keys (renamed display-only):
      // pest_category is a curated "best categories" list, parent narrows to
      // categories that have subcategories. parent_only was a no-op and is
      // hidden from the form (see HIDDEN_BACK_KEYS); saved values survive.
      // pest_category is a declared legacy flag — it renders in Advanced.
      { key: 'pest_category', kind: 'boolean', group: 'advanced', labelKey: 'sections.pestCategory' },
      { key: 'parent', kind: 'boolean', group: 'content', labelKey: 'sections.parentFlag' },
    ],
  },
  products: {
    front: [
      COLUMNS(),
      { key: 'layout', kind: 'select', group: 'layout', options: SHELF_LAYOUT_OPTIONS, labelKey: 'sections.layout', defaultValue: 'slider' },
      { key: 'badge_text', kind: 'localized', group: 'extras', labelKey: 'sections.badgeText' },
      { key: 'subtitle', kind: 'localized', group: 'general', labelKey: 'sections.subtitle' },
      { key: 'show_title', kind: 'boolean', group: 'general', labelKey: 'sections.showTitle', defaultValue: true },
      { key: 'show_timer', kind: 'boolean', group: 'extras', labelKey: 'sections.showTimer' },
      { key: 'timer_end_at', kind: 'datetime', group: 'extras', labelKey: 'sections.timerEndAt' },
    ],
    back: [],
  },
  banners: {
    front: [
      COLUMNS(),
      { key: 'layout', kind: 'select', group: 'layout', options: SHELF_LAYOUT_OPTIONS, labelKey: 'sections.layout', defaultValue: 'slider' },
      { key: 'badge_text', kind: 'localized', group: 'extras', labelKey: 'sections.badgeText' },
      { key: 'subtitle', kind: 'localized', group: 'general', labelKey: 'sections.subtitle' },
      { key: 'show_title', kind: 'boolean', group: 'general', labelKey: 'sections.showTitle', defaultValue: true },
      { key: 'show_timer', kind: 'boolean', group: 'extras', labelKey: 'sections.showTimer' },
      { key: 'timer_end_at', kind: 'datetime', group: 'extras', labelKey: 'sections.timerEndAt' },
    ],
    back: [],
  },
  tags: {
    front: [
      { key: 'show_title', kind: 'boolean', group: 'general', labelKey: 'sections.showTitle', defaultValue: true },
      { key: 'show_hashtag', kind: 'boolean', group: 'general', labelKey: 'sections.showHashtag', defaultValue: true },
      { key: 'tone', kind: 'select', group: 'layout', options: TAG_TONE_OPTIONS, labelKey: 'sections.tone', defaultValue: 'dark' },
    ],
    back: [],
  },
};

// ─── New-section defaults ────────────────────────────────────────
//
// Documented defaults for a type's `setting.front`. Applied only when the user
// selects a type in create mode; edit mode always starts from stored values so
// saving without changes stays byte-identical (see docs/section-settings-fields.md).

export const SECTION_FRONT_DEFAULTS: Record<string, Record<string, unknown>> = {
  categories: {
    columns_count: 8,
    rows_count: 1,
    tablet_columns_count: 4,
    tablet_rows_count: 2,
    mobile_columns_count: 4,
    mobile_rows_count: 2,
  },
};

/** Fresh defaults object so callers can't mutate the shared registry. */
export function defaultFrontSettingsForType(type: string): Record<string, unknown> {
  return { ...(SECTION_FRONT_DEFAULTS[type] ?? {}) };
}

// ─── Merging ─────────────────────────────────────────────────────

export interface MergedSettings {
  /** Fields declared by template or registry. */
  fields: SettingsFieldSpec[];
  /** Safety net: saved-data keys nobody declared. */
  extra: SettingsFieldSpec[];
}

/**
 * Builds the render lists for one section type and one settings group.
 *
 * `fields` order: template keys → registry keys the template missed.
 * `extra` holds remaining saved-data keys so gaps can never be invisible.
 * Both lists are deduped by key; nothing can appear twice.
 */
export function mergeSettingsFields(
  type: string,
  group: 'front' | 'back',
  template: Record<string, unknown>,
  data: Record<string, unknown>,
  filters: {
    /** Keys rendered by the preview panel instead (e.g. categories shape). */
    inlineKeys?: string[];
    /** Keys hidden entirely (e.g. products back.type / template-hidden fields). */
    hiddenPredicate?: (key: string) => boolean;
  } = {}
): MergedSettings {
  const { inlineKeys = [], hiddenPredicate } = filters;
  const registry = new Map<string, SettingsFieldSpec>(
    (SECTION_FIELD_FALLBACKS[type]?.[group] ?? []).map((spec) => [spec.key, spec])
  );

  const skip = (key: string) => inlineKeys.includes(key) || hiddenPredicate?.(key) || false;

  /**
   * Resolves the editor tab for a field. Registry entries declare their own
   * group; everything else derives one from the per-type overrides, the key
   * map, or the side (back → content). Saved-data leftovers always land in
   * `advanced` (read-only Other Settings).
   */
  const resolveGroup = (key: string, spec: SettingsFieldSpec, isExtra: boolean): FieldGroup => {
    if (isExtra) return 'advanced';
    if (spec.group) return spec.group;
    return (
      TYPE_KEY_GROUP[type]?.[key] ?? KEY_GROUP[key] ?? (group === 'back' ? 'content' : 'extras')
    );
  };

  const fields: SettingsFieldSpec[] = [];
  const extra: SettingsFieldSpec[] = [];
  const seen = new Set<string>();
  const take = (key: string, spec: SettingsFieldSpec, isExtra = false) => {
    if (seen.has(key)) return;
    seen.add(key);
    (isExtra ? extra : fields).push({ ...spec, group: resolveGroup(key, spec, isExtra) });
  };

  // 1) Template first. An enriched template spec is authoritative and beats
  //    the registry; a plain template default only contributes the key, so
  //    the registry (when present) supplies richer metadata.
  for (const [key, templateValue] of Object.entries(template)) {
    if (skip(key) || seen.has(key)) continue;
    const spec = isFieldSpec(templateValue)
      ? normalizeFieldSpec(key, templateValue, data[key])
      : registry.get(key) ?? normalizeFieldSpec(key, templateValue, data[key]);
    take(key, spec);
  }

  // 2) Registry gaps.
  for (const spec of registry.values()) {
    if (skip(spec.key) || seen.has(spec.key)) continue;
    take(spec.key, spec);
  }

  // 3) Saved-data leftovers (empty on create, filled on edit). Hidden keys
  //    still surface here so removed-but-saved values (order_price,
  //    parent_only, storefront no-ops) stay visible — read-only in Other
  //    Settings / Ignored settings — instead of vanishing from the editor.
  //    Inline keys keep their dedicated control and are not duplicated.
  for (const key of Object.keys(data)) {
    if (seen.has(key) || inlineKeys.includes(key)) continue;
    take(key, registry.get(key) ?? normalizeFieldSpec(key, data[key], data[key]), true);
  }

  return { fields, extra };
}

export function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

// ─── Hero media linking ─────────────────────────────────────────
//
// The Hero resource is a separate library from the hero section. The section
// still stores plain paths (`video_desktop`, `video_mobile`, `poster`), so the
// picker only maps a selected hero onto those keys — the storefront contract
// is untouched. Selection is derived from the stored paths (no extra setting
// key), which means it also survives reloads without backend changes.

/** Minimal shape the mapper needs from a Hero record. */
export interface HeroMediaSource {
  id: number;
  type: string;
  is_active?: boolean;
  media?: { url: string; thumb_url?: string | null } | null;
}

/** Front-settings keys that can point at hero media. */
const HERO_MEDIA_KEYS = [
  'video_desktop',
  'video_mobile',
  'poster',
  'image_desktop',
  'image_mobile',
] as const;

/**
 * Path-only normalization: the API may return absolute storage URLs while a
 * section may store the same file as a relative path (and vice versa).
 */
function normalizeMediaPath(value: string): string {
  let pathname: string;
  try {
    pathname = new URL(value, 'http://media.local').pathname;
  } catch {
    pathname = value;
  }
  // Stored paths and API URLs can differ by a trailing slash only; treat them
  // as the same file (`/a/b/` === `/a/b`). Keep the root path intact.
  return pathname.replace(/\/+$/, '') || '/';
}

/** Finds the hero whose media URL is referenced by the current settings. */
export function findLinkedHero<T extends HeroMediaSource>(
  heroes: T[],
  values: Record<string, unknown>
): T | undefined {
  const storedPaths = new Set<string>();
  for (const key of HERO_MEDIA_KEYS) {
    const value = values[key];
    if (typeof value === 'string' && value.trim()) {
      storedPaths.add(normalizeMediaPath(value.trim()));
    }
  }
  if (storedPaths.size === 0) return undefined;

  return heroes.find((hero) => {
    const url = hero.media?.url;
    return !!url && storedPaths.has(normalizeMediaPath(url));
  });
}

/**
 * Maps one hero onto the section's media keys.
 *
 * Hero records carry a single `media` file today, so videos fill desktop and
 * mobile with the same URL (a backend change is required for two renditions).
 * A poster is only overwritten when the hero has a thumbnail.
 */
export function heroMediaPatch(hero: HeroMediaSource): Record<string, unknown> {
  const url = hero.media?.url;
  if (!url) return {};

  if (hero.type === 'video') {
    const patch: Record<string, unknown> = {
      media_type: 'video',
      video_desktop: url,
      video_mobile: url,
    };
    const thumb = hero.media?.thumb_url;
    if (thumb) patch.poster = thumb;
    return patch;
  }

  // Image heroes read `image_desktop` / `image_mobile` first, so fill both
  // renditions (single hero file today) and keep `poster` as a fallback.
  return {
    media_type: 'image',
    image_desktop: url,
    image_mobile: url,
    poster: url,
  };
}
