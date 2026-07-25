import { axiosClient } from '@/shared/api';
import type {
  SlidersListResponse,
  SliderDetailResponse,
  ApiResponse,
  ChangeStatusResponse,
  CreateSliderData,
  UpdateSliderData,
  Slider,
  ProductsResponse,
} from '../types/slider.types';
export interface FetchSlidersParams {
  page?: number;
  perPage?: number;
  search?: string;
  active?: boolean;
  order?: string;
  sortedBy?: string;
}

export async function fetchSliders({
  page = 1,
  perPage = 15,
  search,
  active,
  order,
  sortedBy,
}: FetchSlidersParams = {}): Promise<SlidersListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());

  if (search) params.append('search', search);
  if (active !== undefined) params.append('active', active ? '1' : '0');
  if (order) params.append('order', order);
  if (sortedBy) params.append('sortedBy', sortedBy);

  const { data } = await axiosClient.get<SlidersListResponse>('/sliders?' + params.toString());
  return data;
}


export async function fetchSliderById(id: number): Promise<SliderDetailResponse> {
  const { data } = await axiosClient.get<SliderDetailResponse>('/sliders/' + id);
  return data;
}

export async function createSlider(payload: CreateSliderData): Promise<ApiResponse<Slider>> {
  const formData = new FormData();
  formData.append('title[en]', payload['title[en]']);
  formData.append('title[ar]', payload['title[ar]']);
  formData.append('status', payload.status);

  if (payload.image_desktop) formData.append('image_desktop', payload.image_desktop);
  if (payload.image_mobile) formData.append('image_mobile', payload.image_mobile);
  if (payload.products && payload.products.length > 0) {
    payload.products.forEach((id) => formData.append('products[]', id.toString()));
  }

  const { data } = await axiosClient.post<ApiResponse<Slider>>('/sliders', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateSlider(
  id: number,
  payload: UpdateSliderData
): Promise<ApiResponse<Slider>> {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  formData.append('title[en]', payload['title[en]']);
  formData.append('title[ar]', payload['title[ar]']);
  formData.append('status', payload.status);

  if (payload.image_desktop) formData.append('image_desktop', payload.image_desktop);
  if (payload.image_mobile) formData.append('image_mobile', payload.image_mobile);
  if (payload.products && payload.products.length > 0) {
    payload.products.forEach((id) => formData.append('products[]', id.toString()));
  }

  const { data } = await axiosClient.post<ApiResponse<Slider>>('/sliders/' + id, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteSlider(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/sliders/' + id);
  return data;
}

export async function changeSliderStatus(id: number): Promise<ChangeStatusResponse> {
  const { data } = await axiosClient.patch<ChangeStatusResponse>('/sliders/change-status', { id });
  return data;
}

export async function reorderSliders(sliderIds: number[]): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.put<ApiResponse<null>>('/sliders/reorder', { sliders: sliderIds });
  return data;
}

export async function searchProducts(search: string): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('per_page', '20');
  const { data } = await axiosClient.get<ProductsResponse>('/products?' + params.toString());
  return data;
}
