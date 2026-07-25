import { axiosClient } from '@/shared/api';
import type {
  SectionsListResponse,
  SectionDetailResponse,
  SectionTypesResponse,
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
  const { data } = await axiosClient.post<DeleteResponse>('/sections/reorder', {
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

export async function fetchProductTypes(): Promise<string[]> {
  const { data } = await axiosClient.get<string[]>('/product-type');
  return data;
}

export async function searchEntities(endpoint: string, search: string): Promise<any> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('per_page', '20');
  const { data } = await axiosClient.get(
    `/${endpoint}?${params.toString()}`
  );
  return data;
}
