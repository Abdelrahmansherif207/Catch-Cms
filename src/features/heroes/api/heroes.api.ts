import { axiosClient } from '@/shared/api';
import type {
  HeroesListResponse,
  HeroDetailResponse,
  ApiResponse,
  CreateHeroData,
  UpdateHeroData,
  FetchHeroesParams,
} from '../types/hero.types';

export async function fetchHeroes({
  page = 1,
  perPage = 15,
  isActive,
  type,
}: FetchHeroesParams = {}): Promise<HeroesListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  if (isActive !== undefined) params.append('is_active', isActive ? '1' : '0');
  if (type && type !== 'all') params.append('type', type);

  const { data } = await axiosClient.get<HeroesListResponse>('/hero?' + params.toString());
  return data;
}

export async function fetchHeroById(id: number): Promise<HeroDetailResponse> {
  const { data } = await axiosClient.get<HeroDetailResponse>('/hero/' + id);
  return data;
}

export async function createHero(payload: CreateHeroData): Promise<ApiResponse<HeroDetailResponse>> {
  const formData = new FormData();
  formData.append('type', payload.type);
  formData.append('media', payload.media, payload.media.name);
  if (payload['description[en]']) formData.append('description[en]', payload['description[en]']);
  if (payload['description[ar]']) formData.append('description[ar]', payload['description[ar]']);
  formData.append('is_active', payload.is_active === '1' ? '1' : '0');

  const { data } = await axiosClient.post<ApiResponse<HeroDetailResponse>>('/hero', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateHero(
  id: number,
  payload: UpdateHeroData
): Promise<ApiResponse<HeroDetailResponse>> {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  if (payload.type) formData.append('type', payload.type);
  if (payload.media) formData.append('media', payload.media, payload.media.name);
  // Always send both description keys on update: omitting one leaves the
  // stored translation untouched, which makes clearing a description
  // impossible. An explicit empty string clears it instead.
  if (payload['description[en]'] !== undefined) {
    formData.append('description[en]', payload['description[en]']);
  }
  if (payload['description[ar]'] !== undefined) {
    formData.append('description[ar]', payload['description[ar]']);
  }
  if (payload.is_active !== undefined) {
    formData.append('is_active', payload.is_active === '1' ? '1' : '0');
  }

  // Multipart bodies can't reach a real PUT route, so use method spoofing
  // (same approach as banners).
  const { data } = await axiosClient.post<ApiResponse<HeroDetailResponse>>('/hero/' + id, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function toggleHeroActive(id: number): Promise<ApiResponse<Record<string, unknown>>> {
  const { data } = await axiosClient.patch<ApiResponse<Record<string, unknown>>>(
    '/hero/' + id + '/toggle-active'
  );
  return data;
}

export async function deleteHero(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/hero/' + id);
  return data;
}
