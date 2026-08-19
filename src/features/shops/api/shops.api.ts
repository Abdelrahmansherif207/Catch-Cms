import { axiosClient } from '@/shared/api';
import type { ShopsListResponse } from '../types/shop.types';

export interface FetchShopsParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export async function fetchShops({
  page = 1,
  perPage = 15,
  search,
}: FetchShopsParams = {}): Promise<ShopsListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  if (search) params.append('search', search);

  const { data } = await axiosClient.get<ShopsListResponse>(`/shops?${params.toString()}`);
  return data;
}
