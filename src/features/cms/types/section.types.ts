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
  title?: { en: string; ar: string };
  order?: number;
  is_active?: number;
  title_visible?: number;
  setting?: {
    front?: Record<string, unknown>;
    back?: Record<string, unknown>;
  };
}
