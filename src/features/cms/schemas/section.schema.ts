import { z } from 'zod';
import type { CreateSectionPayload, UpdateSectionPayload } from '../types/section.types';

// ─── Form Schema ─────────────────────────────────────────────────

export const sectionFormSchema = z.object({
  type: z.string().min(1, 'sections.validation.typeRequired'),
  titleEn: z.string().min(1, 'sections.validation.titleEnRequired').max(50),
  titleAr: z.string().min(1, 'sections.validation.titleArRequired').max(50),
  isActive: z.boolean().default(true),
  titleVisible: z.boolean().default(true),
  frontSettings: z.record(z.string(), z.unknown()).optional(),
  backSettings: z.record(z.string(), z.unknown()).optional(),
  productType: z.string().nullable().optional(),
});

export type SectionFormValues = z.infer<typeof sectionFormSchema>;

export const sectionFormDefaults: SectionFormValues = {
  type: '',
  titleEn: '',
  titleAr: '',
  isActive: true,
  titleVisible: true,
  frontSettings: {},
  backSettings: {},
  productType: null,
};

// ─── Title draft ─────────────────────────────────────────────────

/**
 * Reads the stored title, which may be a localized JSON string or plain text.
 *
 * A plain string is the current-locale value: the API resolves it and returns
 * no `title_translations`, so the other locale's stored translation is not
 * available here. Both inputs show the resolved string, but the submit path
 * only sends locales the user actually edits (see `toUpdatePayload`), so the
 * untouched locale is preserved server-side.
 */
export function toTitleDraft(title: unknown): { en: string; ar: string } {
  if (typeof title === 'string') {
    try {
      const parsed = JSON.parse(title) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        return {
          en: typeof parsed.en === 'string' ? parsed.en : '',
          ar: typeof parsed.ar === 'string' ? parsed.ar : '',
        };
      }
    } catch {
      return { en: title, ar: title };
    }
    return { en: '', ar: '' };
  }

  if (title && typeof title === 'object') {
    const record = title as Record<string, unknown>;
    return {
      en: typeof record.en === 'string' ? record.en : '',
      ar: typeof record.ar === 'string' ? record.ar : '',
    };
  }

  return { en: '', ar: '' };
}

/**
 * True when the stored title is a plain (non-JSON) string: the API resolved it
 * to the current locale without exposing the other locale, which is why the
 * update path only sends the locales the user edited.
 */
export function isPlainTitle(title: unknown): boolean {
  if (typeof title !== 'string') return false;
  try {
    const parsed = JSON.parse(title) as unknown;
    return !parsed || typeof parsed !== 'object';
  } catch {
    return true;
  }
}

// ─── Transform to API format ─────────────────────────────────────

export function toCreatePayload(values: SectionFormValues): CreateSectionPayload {
  const backSettings = { ...(values.backSettings || {}) };

  // If products type with a template, set the type field
  if (values.type === 'products' && values.productType) {
    backSettings.type = values.productType;
  }

  return {
    type: values.type,
    title: {
      en: values.titleEn,
      ar: values.titleAr,
    },
    endpoint: '', // backend generates this from type + settings
    is_active: values.isActive ? 1 : 0,
    title_visible: values.titleVisible ? 1 : 0,
    setting: {
      front: values.frontSettings || {},
      back: backSettings,
    },
  };
}

/**
 * Builds the update payload.
 *
 * `titleLocales` lets the caller send only the locales the user actually
 * edited: the update API merges `title` per locale, so omitting a locale
 * preserves its stored translation. Omit the argument to send both locales
 * (the pre-existing behavior).
 */
export function toUpdatePayload(
  values: SectionFormValues,
  titleLocales?: { en?: string; ar?: string }
): UpdateSectionPayload {
  const backSettings = { ...(values.backSettings || {}) };

  if (values.type === 'products' && values.productType) {
    backSettings.type = values.productType;
  }

  const payload: UpdateSectionPayload = {
    is_active: values.isActive ? 1 : 0,
    title_visible: values.titleVisible ? 1 : 0,
    setting: {
      front: values.frontSettings || {},
      back: backSettings,
    },
  };

  if (!titleLocales) {
    payload.title = { en: values.titleEn, ar: values.titleAr };
  } else if (titleLocales.en !== undefined || titleLocales.ar !== undefined) {
    payload.title = titleLocales;
  }

  return payload;
}
