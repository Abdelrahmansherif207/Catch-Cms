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
}

// ─── Localized { en, ar } helpers ─────────────────────────────────

export function isLocalizedValue(value: unknown): value is LocalizedValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(record, 'en')
    || Object.prototype.hasOwnProperty.call(record, 'ar');
}

/** Normalizes any saved value into editable `{ en, ar }` strings. */
export function toLocalizedDraft(value: unknown): { en: string; ar: string } {
  if (isLocalizedValue(value)) {
    return {
      en: typeof value.en === 'string' ? value.en : '',
      ar: typeof value.ar === 'string' ? value.ar : '',
    };
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

const SPEC_KEYS = new Set(['type', 'options', 'label', 'min', 'max', 'step']);

interface EnrichedSpec {
  type: FieldKind;
  options?: string[];
  label?: string;
  min?: number;
  max?: number;
  step?: number;
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

/** Enum options we know about today; replaced by template specs in phase 2. */
const KEY_SELECT_OPTIONS: Record<string, string[]> = {
  media_type: ['image', 'video'],
  shape: ['square', 'circle'],
  layout: ['grid', 'list', 'slider'],
  theme: ['dark', 'light', 'colorful'],
  tone: ['light', 'dark'],
};

/** Existing i18n labels; new keys fall back to a derived label. */
const KEY_LABEL_I18N: Record<string, string> = {
  autoplay: 'sections.autoplay',
  badge_text: 'sections.badgeText',
  columns_count: 'sections.columnsCount',
  layout: 'sections.layout',
  show_timer: 'sections.showTimer',
  slider_speed: 'sections.sliderSpeed',
  theme: 'sections.theme',
  timer_end_at: 'sections.timerEndAt',
};

export function inferKind(key: string, templateValue: unknown, currentValue: unknown): FieldKind {
  if (key === 'order' || key === 'order_price') return 'order';
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
  const kind: FieldKind =
    inferredKind === 'string' && options && options.length > 0 ? 'select' : inferredKind;
  const labelKey = KEY_LABEL_I18N[key];
  const entry: SettingsFieldSpec = { key, kind };
  if (options) entry.options = options;
  if (labelKey) entry.labelKey = labelKey;
  if (spec?.min !== undefined) entry.min = spec.min;
  if (spec?.max !== undefined) entry.max = spec.max;
  if (spec?.step !== undefined) entry.step = spec.step;
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
    front: [
      { key: 'media_type', kind: 'select', options: KEY_SELECT_OPTIONS.media_type },
      { key: 'video_desktop', kind: 'string' },
      { key: 'video_mobile', kind: 'string' },
      { key: 'poster', kind: 'string' },
      { key: 'eyebrow', kind: 'localized' },
      { key: 'heading', kind: 'localized' },
      { key: 'cta_label', kind: 'localized' },
      { key: 'cta_href', kind: 'string' },
      { key: 'show_cta', kind: 'boolean' },
      { key: 'show_overlay', kind: 'boolean' },
      // Accepted values mirror CatchHeroSection.tsx (storefront source of truth).
      { key: 'content_align', kind: 'select', options: ['start', 'center', 'end'], labelKey: 'sections.contentAlign' },
      { key: 'content_position', kind: 'select', options: ['center', 'bottom'], labelKey: 'sections.contentPosition' },
      { key: 'height', kind: 'select', options: ['compact', 'standard', 'tall'], labelKey: 'sections.height' },
      { key: 'show_mobile_content', kind: 'boolean' },
      { key: 'tone', kind: 'select', options: KEY_SELECT_OPTIONS.tone },
      { key: 'autoplay', kind: 'boolean' },
      { key: 'loop', kind: 'boolean' },
      { key: 'muted', kind: 'boolean' },
    ],
    back: [],
  },
  sliders: {
    front: [
      COLUMNS(),
      { key: 'autoplay', kind: 'boolean', labelKey: 'sections.autoplay' },
      { key: 'slider_speed', kind: 'number', labelKey: 'sections.sliderSpeed', min: 500, step: 500 },
    ],
    back: [],
  },
  promotions: {
    front: [
      COLUMNS(),
      { key: 'layout', kind: 'select', options: KEY_SELECT_OPTIONS.layout, labelKey: 'sections.layout' },
      { key: 'autoplay', kind: 'boolean', labelKey: 'sections.autoplay' },
      { key: 'slider_speed', kind: 'number', labelKey: 'sections.sliderSpeed', min: 500, step: 500 },
    ],
    back: [],
  },
  'flash-sales': {
    front: [
      COLUMNS(),
      { key: 'layout', kind: 'select', options: KEY_SELECT_OPTIONS.layout, labelKey: 'sections.layout' },
      { key: 'autoplay', kind: 'boolean', labelKey: 'sections.autoplay' },
      { key: 'slider_speed', kind: 'number', labelKey: 'sections.sliderSpeed', min: 500, step: 500 },
      { key: 'show_timer', kind: 'boolean', labelKey: 'sections.showTimer' },
      { key: 'timer_end_at', kind: 'datetime', labelKey: 'sections.timerEndAt' },
      { key: 'theme', kind: 'select', options: KEY_SELECT_OPTIONS.theme, labelKey: 'sections.theme' },
    ],
    back: [],
  },
  coupons: {
    front: [
      COLUMNS(),
      { key: 'layout', kind: 'select', options: KEY_SELECT_OPTIONS.layout, labelKey: 'sections.layout' },
      { key: 'subtitle', kind: 'localized' },
      { key: 'show_title', kind: 'boolean' },
    ],
    back: [],
  },
  brands: {
    front: [
      COLUMNS(),
      { key: 'layout', kind: 'select', options: KEY_SELECT_OPTIONS.layout, labelKey: 'sections.layout' },
      { key: 'subtitle', kind: 'localized' },
      { key: 'show_view_all', kind: 'boolean' },
      { key: 'action_label', kind: 'localized' },
      { key: 'action_href', kind: 'string' },
    ],
    back: [],
  },
  categories: {
    front: [
      COLUMNS(8),
      { key: 'subtitle', kind: 'localized' },
      { key: 'show_view_all', kind: 'boolean' },
      { key: 'action_label', kind: 'localized' },
      { key: 'action_href', kind: 'string' },
      { key: 'show_product_count', kind: 'boolean' },
    ],
    back: [],
  },
  products: {
    front: [
      COLUMNS(),
      { key: 'badge_text', kind: 'localized', labelKey: 'sections.badgeText' },
      { key: 'subtitle', kind: 'localized' },
      { key: 'show_title', kind: 'boolean' },
      { key: 'show_timer', kind: 'boolean', labelKey: 'sections.showTimer' },
      { key: 'timer_end_at', kind: 'datetime', labelKey: 'sections.timerEndAt' },
    ],
    back: [],
  },
  banners: {
    front: [COLUMNS()],
    back: [],
  },
};

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

  const fields: SettingsFieldSpec[] = [];
  const extra: SettingsFieldSpec[] = [];
  const seen = new Set<string>();
  const take = (key: string, spec: SettingsFieldSpec, isExtra = false) => {
    if (seen.has(key)) return;
    seen.add(key);
    (isExtra ? extra : fields).push(spec);
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

  // 3) Saved-data leftovers (empty on create, filled on edit).
  for (const key of Object.keys(data)) {
    if (skip(key) || seen.has(key)) continue;
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
const HERO_MEDIA_KEYS = ['video_desktop', 'video_mobile', 'poster'] as const;

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

  return {
    media_type: 'image',
    poster: url,
  };
}
