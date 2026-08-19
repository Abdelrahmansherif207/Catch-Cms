import { axiosClient } from '@/shared/api';
import type {
  PickupLocationsListResponse,
  PickupLocationDetailResponse,
  CreatePickupLocationData,
  UpdatePickupLocationData,
  ApiResponse,
  PickupLocation,
} from '../types/pickup-location.types';

export interface FetchPickupLocationsParams {
  page?: number;
  perPage?: number;
  search?: string;
  active?: string;
  inactive?: string;
  order?: string;
  sortedBy?: string;
}

export async function fetchPickupLocations({
  page = 1,
  perPage = 15,
  search,
  active,
  inactive,
  order,
  sortedBy,
}: FetchPickupLocationsParams = {}): Promise<PickupLocationsListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  if (search) params.append('search', search);
  if (active) params.append('active', active);
  if (inactive) params.append('inactive', inactive);
  if (order) params.append('order', order);
  if (sortedBy) params.append('sortedBy', sortedBy);

  const { data } = await axiosClient.get<PickupLocationsListResponse>('/pickup-locations?' + params.toString());
  return data;
}

export async function fetchPickupLocationById(id: number): Promise<PickupLocationDetailResponse> {
  const { data } = await axiosClient.get<PickupLocationDetailResponse>('/pickup-locations/' + id);
  return data;
}

export async function createPickupLocation(payload: CreatePickupLocationData): Promise<ApiResponse<PickupLocation>> {
  const { data } = await axiosClient.post<ApiResponse<PickupLocation>>('/pickup-locations', payload);
  return data;
}

export async function updatePickupLocation(
  id: number,
  payload: UpdatePickupLocationData
): Promise<ApiResponse<PickupLocation>> {
  const { data } = await axiosClient.put<ApiResponse<PickupLocation>>('/pickup-locations/' + id, payload);
  return data;
}

export async function deletePickupLocation(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/pickup-locations/' + id);
  return data;
}
