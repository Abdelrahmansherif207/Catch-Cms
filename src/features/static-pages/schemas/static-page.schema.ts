import { z } from 'zod';
import type { Language } from '@/shared/constants/api';
import type {
  LocaleMap,
  JsonObject,
  StaticPageUpdatePayload,
  CreateSectionPayload,
  UpdateSectionPayload,
} from '../types/static-page.types';

// ─── Page form (Task 2) ──────────────────────────────────────────

export const staticPageFormSchema = z.object({
  titleEn: z.string().min(1, 'staticPages.validation.titleEnRequired'),
  titleAr: z.string().min(1, 'staticPages.validation.titleArRequired'),
  isActive: z.boolean(),
});

export type StaticPageFormValues = z.infer<typeof staticPageFormSchema>;

export const staticPageFormDefaults: StaticPageFormValues = {
  titleEn: '',
  titleAr: '',
  isActive: true,
};

// Diff a locale map against the original so update payloads only carry
// changed locales — locale merging is handled server-side (Task 5).
function partialLocaleMap(
  original: LocaleMap<string> | undefined,
  next: Record<Language, string>
): LocaleMap<string> {
  const partial: LocaleMap<string> = {};
  (['en', 'ar'] as Language[]).forEach((lang) => {
    if (next[lang] !== undefined && next[lang] !== original?.[lang]) {
      partial[lang] = next[lang];
    }
  });
  return partial;
}

export function toUpdatePagePayload(
  values: StaticPageFormValues,
  original: LocaleMap<string> | undefined
): StaticPageUpdatePayload {
  const title = partialLocaleMap(original, { en: values.titleEn, ar: values.titleAr });
  return {
    ...(Object.keys(title).length > 0 ? { title } : {}),
    is_active: values.isActive,
  };
}

// ─── Section form (Tasks 3 & 4) ──────────────────────────────────

export const sectionFormSchema = z.object({
  titleEn: z.string().min(1, 'staticPages.validation.titleEnRequired'),
  titleAr: z.string().min(1, 'staticPages.validation.titleArRequired'),
});

export type SectionFormValues = z.infer<typeof sectionFormSchema>;

export const sectionFormDefaults: SectionFormValues = {
  titleEn: '',
  titleAr: '',
};

function nonEmptyContent(content: LocaleMap<JsonObject>): LocaleMap<JsonObject> {
  return Object.fromEntries(
    Object.entries(content).filter(([, value]) => value && Object.keys(value).length > 0)
  ) as LocaleMap<JsonObject>;
}

export function toCreateSectionPayload(
  values: SectionFormValues,
  content: LocaleMap<JsonObject>
): CreateSectionPayload {
  return {
    title: { en: values.titleEn, ar: values.titleAr },
    content: nonEmptyContent(content),
  };
}

// Only changed content locales are sent on update (server merges).
export function toUpdateSectionPayload(
  values: SectionFormValues,
  content: LocaleMap<JsonObject>,
  originalContent: LocaleMap<JsonObject>
): UpdateSectionPayload {
  const title: LocaleMap<string> = {};
  if (values.titleEn !== undefined) title.en = values.titleEn;
  if (values.titleAr !== undefined) title.ar = values.titleAr;

  const contentDiff: LocaleMap<JsonObject> = {};
  (['en', 'ar'] as Language[]).forEach((lang) => {
    const next = content[lang];
    const prev = originalContent[lang];
    if (next !== undefined && JSON.stringify(next) !== JSON.stringify(prev ?? {})) {
      contentDiff[lang] = next;
    }
  });

  return {
    title,
    content: nonEmptyContent(contentDiff),
  };
}