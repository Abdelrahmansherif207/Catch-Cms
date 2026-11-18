import { axiosClient } from '@/shared/api';
import type {
  SectionsListResponse,
  SectionDetailResponse,
  SectionTypesResponse,
  ProductTypeOption,
  TypeSettingsResponse,
  ApiResponse,
  Section,
  CreateSectionPayload,
  UpdateSectionPayload,
  DeleteResponse,
} from '../types/section.types';

// ─── Sections CRUD ───────────────────────────────────────────────

export async function fetchSections(): Promise<SectionsListResponse> {
  const { data } = await axiosClient.get<SectionsListResponse>('/sections');
  return data;
}

export async function fetchSectionById(id: number): Promise<SectionDetailResponse> {
  const { data } = await axiosClient.get<SectionDetailResponse>('/sections/' + id);
  return data;
}

export async function createSection(payload: CreateSectionPayload): Promise<ApiResponse<Section>> {
  const { data } = await axiosClient.post<ApiResponse<Section>>('/sections', payload);
  return data;
}

export async function updateSection(
  id: number,
  payload: UpdateSectionPayload
): Promise<ApiResponse<Section>> {
  const { data } = await axiosClient.put<ApiResponse<Section>>('/sections/' + id, payload);
  return data;
}

export async function deleteSection(id: number): Promise<DeleteResponse> {
  const { data } = await axiosClient.delete<DeleteResponse>('/sections/' + id);
  return data;
}

// ─── Toggle & Reorder ────────────────────────────────────────────

export async function toggleSectionActive(id: number): Promise<ApiResponse<Section>> {
  const { data } = await axiosClient.patch<ApiResponse<Section>>(
    '/sections/' + id + '/toggle-active'
  );
  return data;
}

export async function reorderSections(sectionIds: number[]): Promise<DeleteResponse> {
  const { data } = await axiosClient.put<DeleteResponse>('/sections/reorder', {
    sections: sectionIds,
  });
  return data;
}

// ─── Section Types & Settings ────────────────────────────────────

export async function fetchSectionTypes(): Promise<SectionTypesResponse> {
  const { data } = await axiosClient.get<SectionTypesResponse>('/section-types');
  return data;
}

export async function fetchTypeSettings(typeName: string): Promise<TypeSettingsResponse> {
  const { data } = await axiosClient.get<TypeSettingsResponse>(
    '/section-types/' + typeName + '/settings'
  );
  return data;
}

// ─── Product Types ───────────────────────────────────────────────

/**
 * Thrown when `/product-type` does not match the documented
 * `{ [key: string]: string }` object map.
 */
export class ProductTypeResponseError extends Error {
  constructor() {
    super('Malformed product-type response');
    this.name = 'ProductTypeResponseError';
  }
}

/**
 * Converts the documented raw `{ key: label }` map into a stable option list.
 * The original key is preserved as `value`; the API string is display-only.
 * Throws on malformed payloads so React Query surfaces an error state instead
 * of silently rendering an empty dropdown.
 */
export function normalizeProductTypes(payload: unknown): ProductTypeOption[] {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ProductTypeResponseError();
  }

  return Object.entries(payload as Record<string, unknown>).map(([value, label]) => {
    if (typeof label !== 'string') {
      throw new ProductTypeResponseError();
    }
    return { value, label };
  });
}

export async function fetchProductTypes(): Promise<ProductTypeOption[]> {
  const { data } = await axiosClient.get<unknown>('/product-type');
  const payload = unwrapProductTypeEnvelope(data);
  // A wrapped deployment may return a plain string list instead of the
  // documented key→label map; expose it as options with the key as label.
  if (payload !== data && Array.isArray(payload)) {
    return payload.map((value) => {
      if (typeof value !== 'string') {
        throw new ProductTypeResponseError();
      }
      return { value, label: value };
    });
  }
  return normalizeProductTypes(payload);
}

/**
 * The deployment backend may return `/product-type` inside the standard
 * `{ status, message, success, data }` envelope while the documented shape is
 * a raw key→label map. Only unwrap well-formed envelopes so every other shape
 * still reaches the strict normalizer and surfaces an error state.
 */
function unwrapProductTypeEnvelope(payload: unknown): unknown {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.success === 'boolean' && 'data' in record) {
    return record.data;
  }
  return payload;
}

// ─── Section endpoint preview ────────────────────────────────────

/**
 * Fetches a built section endpoint for the live preview. React Query passes
 * its AbortSignal so a superseded request is cancelled instead of resolving
 * into stale cards.
 */
export async function fetchSectionPreviewItems(
  endpoint: string,
  signal?: AbortSignal
): Promise<unknown> {
  const { data } = await axiosClient.get(endpoint, { signal });
  return data;
}

export interface EntitySearchItem {
  id: number | string;
  slug?: string;
  name?: string | { en?: string; ar?: string } | null;
  title?: string | { en?: string; ar?: string } | null;
}

export interface EntitySearchResponse {
  data: EntitySearchItem[] | { data?: EntitySearchItem[]; current_page?: number; last_page?: number };
}

export async function searchEntities(
  endpoint: string,
  search: string,
  page = 1
): Promise<EntitySearchResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('per_page', '20');
  if (page > 1) params.append('page', page.toString());
  const { data } = await axiosClient.get<EntitySearchResponse>(
    `/${endpoint}?${params.toString()}`
  );
  return data;
}
