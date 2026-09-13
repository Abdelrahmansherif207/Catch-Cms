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
// Contract: JSON for text sections, multipart/form-data for media
// sections (`media` holds the file). Multipart PUT is sent as POST
// with `_method=PUT` (Laravel file-upload convention).

function appendBracketed(form: FormData, base: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (value instanceof File) {
    form.append(base, value);
    return;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      appendBracketed(form, `${base}[${key}]`, nested);
    }
    return;
  }
  form.append(base, String(value));
}

function sectionToFormData(
  payload: CreateSectionPayload | UpdateSectionPayload,
  methodOverride?: 'PUT'
): FormData {
  const form = new FormData();
  if (methodOverride) form.append('_method', methodOverride);
  if (payload.type !== undefined) form.append('type', payload.type);
  if (payload.title !== undefined) appendBracketed(form, 'title', payload.title);
  if (payload.content !== undefined) appendBracketed(form, 'content', payload.content);
  if (payload.config !== undefined && payload.config !== null) {
    appendBracketed(form, 'config', payload.config);
  }
  if (payload.is_active !== undefined) form.append('is_active', String(payload.is_active));
  if ('remove_media' in payload && payload.remove_media) form.append('remove_media', '1');
  if (payload.media instanceof File) form.append('media', payload.media);
  return form;
}

function sectionToJsonBody(payload: CreateSectionPayload | UpdateSectionPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.type !== undefined) body.type = payload.type;
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.content !== undefined) body.content = payload.content;
  if (payload.config !== undefined) body.config = payload.config;
  if (payload.is_active !== undefined) body.is_active = payload.is_active;
  if ('remove_media' in payload && payload.remove_media !== undefined) {
    body.remove_media = payload.remove_media;
  }
  return body;
}

export async function createSection(
  slug: string,
  payload: CreateSectionPayload
): Promise<StaticPageSectionResponse> {
  const body =
    payload.media instanceof File
      ? sectionToFormData(payload)
      : sectionToJsonBody(payload);
  const { data } = await axiosClient.post<StaticPageSectionResponse>(
    `/static-pages/${slug}/sections`,
    body
  );
  return data;
}

export async function updateSection(
  slug: string,
  id: number,
  payload: UpdateSectionPayload
): Promise<StaticPageSectionResponse> {
  // File replacement must travel as multipart POST + _method=PUT.
  if (payload.media instanceof File) {
    const { data } = await axiosClient.post<StaticPageSectionResponse>(
      `/static-pages/${slug}/sections/${id}`,
      sectionToFormData(payload, 'PUT')
    );
    return data;
  }
  const { data } = await axiosClient.put<StaticPageSectionResponse>(
    `/static-pages/${slug}/sections/${id}`,
    sectionToJsonBody(payload)
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