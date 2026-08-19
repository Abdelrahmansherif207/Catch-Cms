import { axiosClient } from '@/shared/api';
import type {
  BannersListResponse,
  BannerDetailResponse,
  ApiResponse,
  CreateBannerData,
  UpdateBannerData,
  Banner,
  ProductsResponse,
} from '../types/banner.types';

export interface FetchBannersParams {
  page?: number;
  perPage?: number;
  search?: string;
  active?: boolean;
  order?: string;
  sortedBy?: string;
}

export async function fetchBanners({
  page = 1,
  perPage = 15,
  search,
  active,
  order,
  sortedBy,
}: FetchBannersParams = {}): Promise<BannersListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());

  if (search) params.append('search', search);
  if (active !== undefined) params.append('active', active ? '1' : '0');
  if (order) params.append('order', order);
  if (sortedBy) params.append('sortedBy', sortedBy);

  const { data } = await axiosClient.get<BannersListResponse>('/banners?' + params.toString());
  return data;
}

export async function fetchBannerById(id: number): Promise<BannerDetailResponse> {
  const { data } = await axiosClient.get<BannerDetailResponse>('/banners/' + id);
  return data;
}

export async function createBanner(payload: CreateBannerData): Promise<ApiResponse<Banner>> {
  const formData = new FormData();
  formData.append('title[en]', payload['title[en]']);
  formData.append('title[ar]', payload['title[ar]']);
  formData.append('description[en]', payload['description[en]']);
  formData.append('description[ar]', payload['description[ar]']);
  formData.append('status', payload.status);

  if (payload.image_desktop) formData.append('image_desktop', payload.image_desktop);
  if (payload.image_mobile) formData.append('image_mobile', payload.image_mobile);
  if (payload.products) {
    payload.products.forEach((id) => formData.append('products[]', id.toString()));
  }

  const { data } = await axiosClient.post<ApiResponse<Banner>>('/banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateBanner(
  id: number,
  payload: UpdateBannerData
): Promise<ApiResponse<Banner>> {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  formData.append('title[en]', payload['title[en]'] || '');
  formData.append('title[ar]', payload['title[ar]'] || '');
  formData.append('description[en]', payload['description[en]'] || '');
  formData.append('description[ar]', payload['description[ar]'] || '');
  formData.append('status', payload.status || '1');

  if (payload.image_desktop) formData.append('image_desktop', payload.image_desktop);
  if (payload.image_mobile) formData.append('image_mobile', payload.image_mobile);
  if (payload.products) {
    payload.products.forEach((id) => formData.append('products[]', id.toString()));
  }

  const { data } = await axiosClient.post<ApiResponse<Banner>>('/banners/' + id, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteBanner(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/banners/' + id);
  return data;
}

export async function searchProducts(search: string): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('per_page', '20');
  const { data } = await axiosClient.get<ProductsResponse>('/products?' + params.toString());
  return data;
}
