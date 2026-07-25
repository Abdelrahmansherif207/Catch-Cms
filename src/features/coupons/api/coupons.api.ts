import { axiosClient } from '@/shared/api';
import type {
  CouponListResponse,
  CouponDetailResponse,
  ApiResponse,
  CreateCouponData,
  UpdateCouponData,
  Coupon,
} from '../types/coupon.types';

export interface FetchCouponsParams {
  page?: number;
  perPage?: number;
  search?: string;
  active?: boolean;
  inactive?: boolean;
  order?: string;
  sortedBy?: string;
}

export async function fetchCoupons({
  page = 1,
  perPage = 15,
  search,
  active,
  inactive,
  order,
  sortedBy,
}: FetchCouponsParams = {}): Promise<CouponListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());

  if (search) params.append('search', search);
  if (active !== undefined) params.append('active', active ? '1' : '0');
  if (inactive !== undefined) params.append('inactive', inactive ? '1' : '0');
  if (order) params.append('order', order);
  if (sortedBy) params.append('sortedBy', sortedBy);

  const { data } = await axiosClient.get<CouponListResponse>('/coupons?' + params.toString());
  return data;
}

export async function fetchCouponById(id: number): Promise<CouponDetailResponse> {
  const { data } = await axiosClient.get<CouponDetailResponse>('/coupons/' + id);
  return data;
}

export async function createCoupon(payload: CreateCouponData): Promise<ApiResponse<Coupon>> {
  const formData = new FormData();

  formData.append('name[en]', payload['name[en]']);
  formData.append('name[ar]', payload['name[ar]']);
  if (payload.discount !== undefined) formData.append('discount', payload.discount);
  formData.append('discount_type', payload.discount_type);
  formData.append('start_date', payload.start_date);
  formData.append('end_date', payload.end_date);
  formData.append('status', payload.status);
  formData.append('image-desktop', payload['image-desktop']);
  formData.append('image-mobile', payload['image-mobile']);

  if (payload.max_discount_amount) formData.append('max_discount_amount', payload.max_discount_amount);
  if (payload.limiter) formData.append('limiter', payload.limiter);
  if (payload.border_color) formData.append('border_color', payload.border_color);
  if (payload.borderless) formData.append('borderless', payload.borderless);

  const { data } = await axiosClient.post<ApiResponse<Coupon>>('/coupons', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateCoupon(
  id: number,
  payload: UpdateCouponData
): Promise<ApiResponse<Coupon>> {
  const formData = new FormData();

  formData.append('_method', 'PUT');
  if (payload['name[en]']) formData.append('name[en]', payload['name[en]']);
  if (payload['name[ar]']) formData.append('name[ar]', payload['name[ar]']);
  if (payload.discount) formData.append('discount', payload.discount);
  if (payload.discount_type) formData.append('discount_type', payload.discount_type);
  if (payload.start_date) formData.append('start_date', payload.start_date);
  if (payload.end_date) formData.append('end_date', payload.end_date);
  if (payload.status) formData.append('status', payload.status);
  if (payload['image-desktop']) formData.append('image-desktop', payload['image-desktop']);
  if (payload['image-mobile']) formData.append('image-mobile', payload['image-mobile']);
  if (payload.max_discount_amount) formData.append('max_discount_amount', payload.max_discount_amount);
  if (payload.limiter) formData.append('limiter', payload.limiter);
  if (payload.border_color) formData.append('border_color', payload.border_color);
  if (payload.borderless) formData.append('borderless', payload.borderless);

  const { data } = await axiosClient.post<ApiResponse<Coupon>>('/coupons/' + id, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteCoupon(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/coupons/' + id);
  return data;
}
