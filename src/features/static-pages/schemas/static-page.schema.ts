import { z } from 'zod';
import type { Language } from '@/shared/constants/api';
import type { ApiErrorResponse } from '@/shared/api';
import type {
  LocaleMap,
  JsonObject,
  StaticPageUpdatePayload,
  CreateSectionPayload,
  UpdateSectionPayload,
  StaticSectionMedia,
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
    is_active: values.isActive ? 1 : 0,
  };
}

// ─── Section form ────────────────────────────────────────────────
// Contract: `type` in text|image|video|screenshot, `title.en` required,
// `content` required when type=text, `config` nullable object,
// `is_active` as 0|1, `media` file for media types (prohibited for text).

export const STATIC_SECTION_TYPES = ['text', 'image', 'video', 'screenshot'] as const;

export type StaticSectionTypeValue = (typeof STATIC_SECTION_TYPES)[number];

export const SECTION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const SECTION_VIDEO_MAX_BYTES = 20 * 1024 * 1024;

export const SECTION_IMAGE_ACCEPT = 'image/jpeg,image/png,image/jpg,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';
export const SECTION_VIDEO_ACCEPT = 'video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,.mp4,.webm,.ogg,.mov,.avi';

export function isMediaSectionType(type: string | undefined): boolean {
  return type === 'image' || type === 'video' || type === 'screenshot';
}

// ─── Section media rules (R3) ───────────────────────────────────
// Pure rules shared by the dialog and tests. Media types (image, video,
// screenshot) always need a file on create and when switching type; on
// edit, existing media may be kept or explicitly removed without one.

export type SectionMediaValidationError =
  | 'staticPages.validation.mediaProhibited'
  | 'staticPages.validation.mediaTooLarge'
  | 'staticPages.validation.mediaRequired';

export interface SectionMediaValidationInput {
  isEditing: boolean;
  type: string;
  mediaFile: File | null;
  /** Intentional removal of existing media needs no replacement file. */
  removeMedia: boolean;
  originalType?: string;
  existingMedia?: StaticSectionMedia | null;
  maxBytes: number;
}

export function validateSectionMedia(
  input: SectionMediaValidationInput
): SectionMediaValidationError | null {
  const { isEditing, type, mediaFile, originalType, existingMedia, maxBytes } = input;

  // Text sections never carry media; removing media is implicit there.
  if (!isMediaSectionType(type)) {
    return mediaFile ? 'staticPages.validation.mediaProhibited' : null;
  }

  // A selected replacement file must respect the per-type size limit.
  if (mediaFile) {
    return mediaFile.size > maxBytes ? 'staticPages.validation.mediaTooLarge' : null;
  }

  // Creating a media section always requires a file.
  if (!isEditing) return 'staticPages.validation.mediaRequired';

  // Switching between image/video/screenshot requires a replacement file.
  // This is checked before removal so `removeMedia` cannot bypass it.
  if (originalType !== undefined && type !== originalType) {
    return 'staticPages.validation.mediaRequired';
  }

  // Same media type: existing media is either preserved or removed
  // (`removeMedia: true`); neither case needs a new upload. `removeMedia`
  // deliberately does not change validity — it only changes the payload.
  if (existingMedia) return null;

  return 'staticPages.validation.mediaRequired';
}

export interface SectionMediaSelection {
  mediaFile: File | null;
  removeMedia: boolean;
}

/** Choosing a replacement file always clears a pending removal. */
export function selectSectionMediaFile(
  file: File | null,
  currentRemoveMedia = false
): SectionMediaSelection {
  return {
    mediaFile: file,
    // Cancelling the file picker keeps the removal choice.
    removeMedia: file ? false : currentRemoveMedia,
  };
}

/** Choosing removal clears any selected replacement file and its preview. */
export function selectSectionRemoveMedia(remove: boolean): SectionMediaSelection {
  return { mediaFile: null, removeMedia: remove };
}

export interface SectionServerErrorState {
  serverErrors: Record<string, string[]>;
  mediaError: string | null;
  configError: string | null;
}

/** Map a 422 API error to the dialog's field-level error state. */
export function extractSectionServerErrors(error: unknown): SectionServerErrorState {
  const apiError = error as ApiErrorResponse | null | undefined;
  if (!apiError || apiError.status !== 422 || !apiError.errors) {
    return { serverErrors: {}, mediaError: null, configError: null };
  }
  return {
    serverErrors: apiError.errors,
    mediaError: apiError.errors.media?.[0] ?? null,
    configError: apiError.errors.config?.[0] ?? null,
  };
}

export const sectionFormSchema = z.object({
  titleEn: z.string().min(1, 'staticPages.validation.titleEnRequired'),
  titleAr: z.string().min(1, 'staticPages.validation.titleArRequired'),
  type: z.enum(STATIC_SECTION_TYPES),
  isActive: z.boolean(),
  /** Raw JSON typed into the config textarea; parsed on submit. */
  configText: z.string(),
});

export type SectionFormValues = z.infer<typeof sectionFormSchema>;

export const sectionFormDefaults: SectionFormValues = {
  titleEn: '',
  titleAr: '',
  type: 'text',
  isActive: true,
  configText: '',
};

export function sectionFormDefaultsFor(
  section?: {
    title?: LocaleMap<string> | Record<string, string> | string;
    type?: string;
    is_active?: boolean;
    config?: JsonObject | null;
  } | null
): SectionFormValues {
  if (!section) return { ...sectionFormDefaults };
  const title = parseSectionTitle(section.title);
  return {
    titleEn: title.en ?? '',
    titleAr: title.ar ?? '',
    type: isSectionTypeValue(section.type) ? section.type : 'text',
    isActive: section.is_active ?? true,
    configText: section.config ? JSON.stringify(section.config, null, 2) : '',
  };
}

function parseSectionTitle(
  title: LocaleMap<string> | Record<string, string> | string | undefined
): LocaleMap<string> {
  if (!title) return {};
  if (typeof title === 'string') {
    try {
      return JSON.parse(title) as LocaleMap<string>;
    } catch {
      return { en: title, ar: title };
    }
  }
  return title as LocaleMap<string>;
}

function isSectionTypeValue(value: string | undefined): value is StaticSectionTypeValue {
  return (
    value === 'text' || value === 'image' || value === 'video' || value === 'screenshot'
  );
}

/** Empty string → undefined (omit). "null" → null. Object → object. Else error key. */
export function tryParseConfigText(raw: string | undefined): {
  config: JsonObject | null | undefined;
  error?: string;
} {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { config: undefined };
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed === null) return { config: null };
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { config: parsed as JsonObject };
    }
    return { config: undefined, error: 'staticPages.validation.configMustBeObject' };
  } catch {
    return { config: undefined, error: 'staticPages.validation.configInvalidJson' };
  }
}

function nonEmptyContent(content: LocaleMap<JsonObject>): LocaleMap<JsonObject> {
  return Object.fromEntries(
    Object.entries(content).filter(([, value]) => value && Object.keys(value).length > 0)
  ) as LocaleMap<JsonObject>;
}

export function toCreateSectionPayload(
  values: SectionFormValues,
  content: LocaleMap<JsonObject>,
  extra?: { config?: JsonObject | null; media?: File }
): CreateSectionPayload {
  return {
    type: values.type,
    title: { en: values.titleEn, ar: values.titleAr },
    content: nonEmptyContent(content),
    ...(extra?.config !== undefined ? { config: extra.config } : {}),
    is_active: values.isActive ? 1 : 0,
    ...(extra?.media instanceof File ? { media: extra.media } : {}),
  };
}

// Only changed content locales are sent on update (server merges).
// `type`/`config`/`is_active` are diffed against the originals so the
// payload only carries what changed — except title which is always sent
// (both locales are required by the form).
export function toUpdateSectionPayload(
  values: SectionFormValues,
  content: LocaleMap<JsonObject>,
  originalContent: LocaleMap<JsonObject>,
  original?: {
    type?: string;
    config?: JsonObject | null;
    is_active?: boolean;
    title?: LocaleMap<string> | Record<string, string> | string;
  },
  extra?: { config?: JsonObject | null; media?: File; removeMedia?: boolean }
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

  const payload: UpdateSectionPayload = {
    title,
    content: nonEmptyContent(contentDiff),
  };

  if (!original || values.type !== (original.type ?? 'text')) {
    payload.type = values.type;
  }

  const originalActive = original?.is_active ?? true;
  if (values.isActive !== originalActive) {
    payload.is_active = values.isActive ? 1 : 0;
  }

  if (extra && 'config' in extra && extra.config !== undefined) {
    const prevConfig = original?.config ?? null;
    if (JSON.stringify(extra.config) !== JSON.stringify(prevConfig)) {
      payload.config = extra.config;
    }
  }

  // A replacement file and a removal are mutually exclusive: when a file is
  // present it wins, so `media` and `remove_media` never travel together.
  if (extra?.media instanceof File) {
    payload.media = extra.media;
  } else if (extra?.removeMedia) {
    payload.remove_media = true;
  }

  return payload;
}