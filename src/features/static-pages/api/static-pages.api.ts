import { axiosClient } from '@/shared/api';
import type {
  StaticPagesListResponse,
  StaticPageDetailResponse,
  StaticPageSectionResponse,
  ReorderResponse,
  DeleteResponse,
  StaticPageUpdatePayload,
  CreateSectionPayload,
  UpdateSectionPayload,
} from '../types/static-page.types';

// ─── Public preview (lang header applied by axios interceptor) ────

export async function fetchStaticPagePreview(slug: string): Promise<StaticPageDetailResponse> {
  const { data } = await axiosClient.get<StaticPageDetailResponse>(
    `/general/static-pages/${slug}`
  );
  return data;
}

export async function fetchStaticPagesPublic(): Promise<StaticPagesListResponse> {
  const { data } = await axiosClient.get<StaticPagesListResponse>('/general/static-pages');
  return data;
}

// ─── Admin — pages ────────────────────────────────────────────────

export async function fetchStaticPages(): Promise<StaticPagesListResponse> {
  const { data } = await axiosClient.get<StaticPagesListResponse>('/static-pages');
  return data;
}

export async function fetchStaticPageBySlug(slug: string): Promise<StaticPageDetailResponse> {
  const { data } = await axiosClient.get<StaticPageDetailResponse>(`/static-pages/${slug}`);
  return data;
}

export async function updateStaticPage(
  slug: string,
  payload: StaticPageUpdatePayload
): Promise<StaticPageDetailResponse> {
  const { data } = await axiosClient.put<StaticPageDetailResponse>(`/static-pages/${slug}`, payload);
  return data;
}

// ─── Admin — sections ─────────────────────────────────────────────

export async function createSection(
  slug: string,
  payload: CreateSectionPayload
): Promise<StaticPageSectionResponse> {
  const { data } = await axiosClient.post<StaticPageSectionResponse>(
    `/static-pages/${slug}/sections`,
    payload
  );
  return data;
}

export async function updateSection(
  slug: string,
  id: number,
  payload: UpdateSectionPayload
): Promise<StaticPageSectionResponse> {
  const { data } = await axiosClient.put<StaticPageSectionResponse>(
    `/static-pages/${slug}/sections/${id}`,
    payload
  );
  return data;
}

export async function deleteSection(slug: string, id: number): Promise<DeleteResponse> {
  const { data } = await axiosClient.delete<DeleteResponse>(`/static-pages/${slug}/sections/${id}`);
  return data;
}

export async function reorderSections(slug: string, sectionIds: number[]): Promise<ReorderResponse> {
  const { data } = await axiosClient.post<ReorderResponse>(
    `/static-pages/${slug}/sections/reorder`,
    { sections: sectionIds }
  );
  return data;
}