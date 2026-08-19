import { axiosClient } from '@/shared/api';
import type {
  FlashSaleListResponse,
  FlashSaleDetailResponse,
  CreateFlashSaleData,
  UpdateFlashSaleData,
  ApiResponse,
  FlashSale,
  ProductsResponse,
} from '../types/flash-sale.types';

export interface FetchFlashSalesParams {
  page?: number;
  perPage?: number;
  search?: string;
  active?: boolean;
  inactive?: boolean;
  order?: string;
  sortedBy?: string;
}

export async function fetchFlashSales({
  page = 1,
  perPage = 15,
  search,
  active,
  inactive,
  order,
  sortedBy,
}: FetchFlashSalesParams = {}): Promise<FlashSaleListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());

  if (search) params.append('search', search);
  if (active !== undefined) params.append('active', active ? '1' : '0');
  if (inactive !== undefined) params.append('inactive', inactive ? '1' : '0');
  if (order) params.append('order', order);
  if (sortedBy) params.append('sortedBy', sortedBy);

  const { data } = await axiosClient.get<FlashSaleListResponse>('/flash-sale?' + params.toString());
  return data;
}

export async function fetchFlashSaleById(id: number): Promise<FlashSaleDetailResponse> {
  const { data } = await axiosClient.get<FlashSaleDetailResponse>('/flash-sale/' + id);
  return data;
}

export async function createFlashSale(payload: CreateFlashSaleData): Promise<ApiResponse<FlashSale>> {
  const formData = new FormData();

  formData.append('title[en]', payload['title[en]']);
  formData.append('title[ar]', payload['title[ar]']);
  formData.append('start_date', payload.start_date);
  formData.append('end_date', payload.end_date);
  formData.append('type', payload.type);
  formData.append('discount', payload.discount);
  formData.append('status', payload.status);

  if (payload['description[en]']) formData.append('description[en]', payload['description[en]']);
  if (payload['description[ar]']) formData.append('description[ar]', payload['description[ar]']);
  if (payload.max_discount_amount) formData.append('max_discount_amount', payload.max_discount_amount);
  if (payload['image-desktop']) formData.append('image-desktop', payload['image-desktop']);
  if (payload['image-mobile']) formData.append('image-mobile', payload['image-mobile']);
  if (payload.products && payload.products.length > 0) {
    payload.products.forEach((id) => formData.append('products[]', id.toString()));
  }

  const { data } = await axiosClient.post<ApiResponse<FlashSale>>('/flash-sale', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateFlashSale(
  id: number,
  payload: UpdateFlashSaleData
): Promise<ApiResponse<FlashSale>> {
  const formData = new FormData();

  formData.append('_method', 'PUT');
  formData.append('title[en]', payload['title[en]']);
  formData.append('title[ar]', payload['title[ar]']);
  formData.append('start_date', payload.start_date);
  formData.append('end_date', payload.end_date);
  formData.append('type', payload.type);
  formData.append('discount', payload.discount);
  formData.append('status', payload.status);

  if (payload['description[en]']) formData.append('description[en]', payload['description[en]']);
  if (payload['description[ar]']) formData.append('description[ar]', payload['description[ar]']);
  if (payload.max_discount_amount) formData.append('max_discount_amount', payload.max_discount_amount);
  if (payload['image-desktop']) formData.append('image-desktop', payload['image-desktop']);
  if (payload['image-mobile']) formData.append('image-mobile', payload['image-mobile']);
  if (payload.products && payload.products.length > 0) {
    payload.products.forEach((id) => formData.append('products[]', id.toString()));
  }

  const { data } = await axiosClient.post<ApiResponse<FlashSale>>('/flash-sale/' + id, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteFlashSale(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/flash-sale/' + id);
  return data;
}

export async function reorderFlashSales(flashSaleIds: number[]): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.put<ApiResponse<null>>('/flash-sale/reorder', { flash_sales: flashSaleIds });
  return data;
}

export async function searchProducts(search: string): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('per_page', '20');
  const { data } = await axiosClient.get<ProductsResponse>('/products?' + params.toString());
  return data;
}
