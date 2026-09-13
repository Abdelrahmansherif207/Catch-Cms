import type { Language } from '@/shared/constants/api';

// ─── JSON value types ─────────────────────────────────────────────
// `content` is a free-form object per locale; shape unknown at build time.

export type JsonPrimitive = string | number | boolean | null;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

export type LocaleMap<T> = Partial<Record<Language, T>>;

export type LocalizedText = string | Record<string, string>;

// ─── Static Page ──────────────────────────────────────────────────

export type StaticSectionType = 'text' | 'image' | 'video' | 'screenshot';

export interface StaticSectionMedia {
  id: number;
  url: string;
  thumb_url: string | null;
  collection_name: 'static-section-image' | 'static-section-video' | string;
  name?: string;
  file_name?: string;
  mime_type: string;
  size: number;
}

export interface StaticPageSection {
  id: number;
  static_page_id: number;
  type: StaticSectionType;
  title: LocalizedText;
  content: LocaleMap<JsonObject>;
  config: JsonObject | null;
  order: number;
  is_active: boolean;
  media: StaticSectionMedia | null;
}

export interface StaticPage {
  id: number;
  slug: string;
  title: LocalizedText;
  is_active: boolean;
  sections?: StaticPageSection[];
}

// ─── API Responses ────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export type StaticPagesListResponse = ApiResponse<StaticPage[]>;
export type StaticPageDetailResponse = ApiResponse<StaticPage>;
export type StaticPageSectionResponse = ApiResponse<StaticPageSection>;
export type ReorderResponse = ApiResponse<null>;
export type DeleteResponse = {
  status: number;
  message: string;
  success: boolean;
};

// ─── Payloads ─────────────────────────────────────────────────────

export interface StaticPageUpdatePayload {
  title?: LocaleMap<string>;
  is_active?: 0 | 1;
}

export interface CreateSectionPayload {
  type: StaticSectionType;
  title: Record<Language, string>;
  content?: LocaleMap<JsonObject>;
  config?: JsonObject | null;
  is_active?: 0 | 1;
  /** Raw file — serialized to multipart `media` by the API layer. */
  media?: File;
}

export interface UpdateSectionPayload {
  type?: StaticSectionType;
  title?: LocaleMap<string>;
  content?: LocaleMap<JsonObject>;
  config?: JsonObject | null;
  is_active?: 0 | 1;
  /** Raw file — serialized to multipart `media` by the API layer. */
  media?: File;
  /** Truthy clears both media collections. Omission keeps existing media. */
  remove_media?: boolean;
}
