import { axiosClient } from '@/shared/api';
import type {
  TagsListResponse,
  ApiResponse,
  Tag,
  CreateTagData,
  UpdateTagData,
} from '../types/tag.types';

export interface FetchTagsParams {
  page?: number;
  perPage?: number;
  search?: string;
  order?: string;
  sortedBy?: string;
}

export async function fetchTags({
  page = 1,
  perPage = 15,
  search,
  order,
  sortedBy,
}: FetchTagsParams = {}): Promise<TagsListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());

  if (search) params.append('search', search);
  if (order) params.append('order', order);
  if (sortedBy) params.append('sortedBy', sortedBy);

  const { data } = await axiosClient.get<TagsListResponse>('/tags?' + params.toString());
  return data;
}

export async function fetchTagById(id: number): Promise<Tag> {
  const { data } = await axiosClient.get<Tag>('/tags/' + id);
  return data;
}

function buildTagFormData(payload: CreateTagData | UpdateTagData) {
  const formData = new FormData();
  formData.append('name', payload.name);

  if (payload.slug) formData.append('slug', payload.slug);
  if (payload.image) formData.append('image', payload.image);
  if (payload.icon) formData.append('icon', payload.icon);

  return formData;
}

export async function createTag(payload: CreateTagData): Promise<ApiResponse<Tag>> {
  const formData = buildTagFormData(payload);
  const { data } = await axiosClient.post<ApiResponse<Tag>>('/tags', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateTag(id: number, payload: UpdateTagData): Promise<ApiResponse<Tag>> {
  const formData = buildTagFormData(payload);
  formData.append('_method', 'PUT');

  const { data } = await axiosClient.post<ApiResponse<Tag>>('/tags/' + id, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteTag(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/tags/' + id);
  return data;
}
