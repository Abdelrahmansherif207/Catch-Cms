// ─── Section Core ────────────────────────────────────────────────

export interface SectionSetting {
  front: Record<string, unknown>;
  back: Record<string, unknown>;
}

export interface Section {
  id: number;
  type: string;
  title: string;
  endpoint: string;
  order: number;
  is_active: boolean;
  title_visible?: boolean;
  setting?: SectionSetting;
}

// ─── API Responses ───────────────────────────────────────────────

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export type SectionsListResponse = ApiResponse<Section[]>;
export type SectionDetailResponse = ApiResponse<Section>;
export type SectionTypesResponse = ApiResponse<string[]>;
/** Documented `/product-type` payload: a plain object map of key → display label. */
export type ProductTypesResponse = Record<string, string>;

/** Normalized product-template option. `value` is the original API key. */
export interface ProductTypeOption {
  value: string;
  label: string;
}

export type TypeSettingsResponse = ApiResponse<{
  front: Record<string, unknown>;
  back: Record<string, unknown>;
}>;
export type ReorderResponse = ApiResponse<undefined>;
export type DeleteResponse = {
  status: number;
  message: string;
  success: boolean;
};

// ─── Payloads ────────────────────────────────────────────────────

export interface CreateSectionPayload {
  type: string;
  title: { en: string; ar: string };
  endpoint: string;
  order?: number;
  is_active?: number;
  title_visible?: number;
  setting?: {
    front?: Record<string, unknown>;
    back?: Record<string, unknown>;
  };
}

export interface UpdateSectionPayload {
  /** The backend merges `title` per locale, so either locale may be omitted. */
  title?: { en?: string; ar?: string };
  order?: number;
  is_active?: number;
  title_visible?: number;
  setting?: {
    front?: Record<string, unknown>;
    back?: Record<string, unknown>;
  };
}
