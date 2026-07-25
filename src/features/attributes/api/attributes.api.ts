import { axiosClient } from '@/shared/api';
import type {
  AttributeListResponse,
  AttributeDetailResponse,
  ApiResponse,
  Attribute,
} from '../types/attribute.types';

export interface FetchAttributesParams {
  page?: number;
  perPage?: number;
  search?: string;
  order?: string;
  sortedBy?: string;
}

export async function fetchAttributes({
  page = 1,
  perPage = 15,
  search,
  order,
  sortedBy,
}: FetchAttributesParams = {}): Promise<AttributeListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());

  if (search) params.append('search', search);
  if (order) params.append('order', order);
  if (sortedBy) params.append('sortedBy', sortedBy);

  const { data } = await axiosClient.get<AttributeListResponse>('/attributes?' + params.toString());
  return data;
}

export async function fetchAttributeById(id: number): Promise<AttributeDetailResponse> {
  const { data } = await axiosClient.get<AttributeDetailResponse>('/attributes/' + id);
  return data;
}

export interface CreateAttributePayload {
  name: { en: string; ar: string };
  values?: { value: { en: string; ar: string } }[];
}

export async function createAttribute(payload: CreateAttributePayload): Promise<ApiResponse<Attribute>> {
  const { data } = await axiosClient.post<ApiResponse<Attribute>>('/attributes', payload);
  return data;
}

export interface UpdateAttributePayload {
  name?: { en: string; ar: string };
  values?: { value: { en: string; ar: string } }[];
}

export async function updateAttribute(
  id: number,
  payload: UpdateAttributePayload
): Promise<ApiResponse<Attribute>> {
  const { data } = await axiosClient.put<ApiResponse<Attribute>>('/attributes/' + id, payload);
  return data;
}

export async function deleteAttribute(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/attributes/' + id);
  return data;
}
