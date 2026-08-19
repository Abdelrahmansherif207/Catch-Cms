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

export interface StaticPageSection {
  id: number;
  static_page_id: number;
  title: LocalizedText;
  content: LocaleMap<JsonObject>;
  order: number;
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
  is_active?: boolean;
}

export interface CreateSectionPayload {
  title: Record<Language, string>;
  content: LocaleMap<JsonObject>;
}

export interface UpdateSectionPayload {
  title?: LocaleMap<string>;
  content?: LocaleMap<JsonObject>;
}
