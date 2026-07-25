import { axiosClient } from '@/shared/api';
import type {
  PromotionListResponse,
  PromotionDetailResponse,
  CreatePromotionData,
  UpdatePromotionData,
  ApiResponse,
  Promotion,
  ProductsResponse,
} from '../types/promotion.types';

export interface FetchPromotionsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  typeAmount?: string;
  active?: boolean;
  inactive?: boolean;
  orderBy?: string;
  sort?: string;
}

export async function fetchPromotions({
  page = 1,
  limit = 15,
  search,
  type,
  typeAmount,
  active,
  inactive,
  orderBy,
  sort,
}: FetchPromotionsParams = {}): Promise<PromotionListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (search) params.append('search', search);
  if (type) params.append('type', type);
  if (typeAmount) params.append('type_amount', typeAmount);
  if (active !== undefined) params.append('active', active ? '1' : '0');
  if (inactive !== undefined) params.append('inactive', inactive ? '1' : '0');
  if (orderBy) params.append('orderBy', orderBy);
  if (sort) params.append('sort', sort);

  const { data } = await axiosClient.get<PromotionListResponse>(
    '/promotions?' + params.toString()
  );
  return data;
}

export async function fetchPromotionById(id: number): Promise<PromotionDetailResponse> {
  const { data } = await axiosClient.get<PromotionDetailResponse>('/promotions/' + id);
  return data;
}

export async function createPromotion(payload: CreatePromotionData): Promise<ApiResponse<Promotion>> {
  const formData = new FormData();

  formData.append('name[en]', payload['name[en]']);
  formData.append('name[ar]', payload['name[ar]']);
  formData.append('type', payload.type);
  formData.append('type_amount', payload.type_amount);
  formData.append('discount', payload.discount);
  formData.append('apply_to', payload.apply_to);
  formData.append('start_at', payload.start_at);
  formData.append('end_at', payload.end_at);
  formData.append('status', payload.status);

  if (payload.minimum_order_amount) formData.append('minimum_order_amount', payload.minimum_order_amount);
  if (payload.image_desktop) formData.append('image_desktop', payload.image_desktop);
  if (payload.image_mobile) formData.append('image_mobile', payload.image_mobile);
  if (payload.max_discount_amount) formData.append('max_discount_amount', payload.max_discount_amount);
  if (payload.required_quantity) formData.append('required_quantity', payload.required_quantity);
  if (payload.product_ids && payload.product_ids.length > 0) {
    payload.product_ids.forEach((id) => formData.append('product_ids[]', id.toString()));
  }
  if (payload.gift_products && payload.gift_products.length > 0) {
    payload.gift_products.forEach((gp, index) => {
      formData.append(`gift_products[${index}][product_id]`, gp.product_id.toString());
      formData.append(`gift_products[${index}][quantity]`, gp.quantity.toString());
      if (gp.variant_id !== undefined) {
        formData.append(`gift_products[${index}][variant_id]`, gp.variant_id.toString());
      }
    });
  }

  const { data } = await axiosClient.post<ApiResponse<Promotion>>('/promotions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updatePromotion(
  id: number,
  payload: UpdatePromotionData
): Promise<ApiResponse<Promotion>> {
  const formData = new FormData();

  formData.append('_method', 'PUT');
  formData.append('name[en]', payload['name[en]']);
  formData.append('name[ar]', payload['name[ar]']);
  formData.append('type', payload.type);
  formData.append('type_amount', payload.type_amount);
  formData.append('discount', payload.discount);
  formData.append('apply_to', payload.apply_to);
  formData.append('start_at', payload.start_at);
  formData.append('end_at', payload.end_at);
  formData.append('status', payload.status);

  if (payload.minimum_order_amount) formData.append('minimum_order_amount', payload.minimum_order_amount);
  if (payload.image_desktop) formData.append('image_desktop', payload.image_desktop);
  if (payload.image_mobile) formData.append('image_mobile', payload.image_mobile);
  if (payload.max_discount_amount) formData.append('max_discount_amount', payload.max_discount_amount);
  if (payload.required_quantity) formData.append('required_quantity', payload.required_quantity);
  if (payload.product_ids && payload.product_ids.length > 0) {
    payload.product_ids.forEach((id) => formData.append('product_ids[]', id.toString()));
  }
  if (payload.gift_products && payload.gift_products.length > 0) {
    payload.gift_products.forEach((gp, index) => {
      formData.append(`gift_products[${index}][product_id]`, gp.product_id.toString());
      formData.append(`gift_products[${index}][quantity]`, gp.quantity.toString());
      if (gp.variant_id !== undefined) {
        formData.append(`gift_products[${index}][variant_id]`, gp.variant_id.toString());
      }
    });
  }

  const { data } = await axiosClient.post<ApiResponse<Promotion>>(
    '/promotions/' + id,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function deletePromotion(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/promotions/' + id);
  return data;
}

export async function searchProducts(search: string): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('per_page', '20');
  const { data } = await axiosClient.get<ProductsResponse>(
    '/products?' + params.toString()
  );
  return data;
}
