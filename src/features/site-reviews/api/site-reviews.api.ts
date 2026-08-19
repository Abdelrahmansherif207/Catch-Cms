import { axiosClient } from '@/shared/api';
import type {
  SiteReview,
  SiteReviewDetailResponse,
  SiteReviewsListResponse,
  ApiResponse,
} from '../types/site-review.types';

export interface FetchSiteReviewsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export async function fetchSiteReviews({
  page = 1,
  limit = 15,
  status = '',
}: FetchSiteReviewsParams = {}): Promise<SiteReviewsListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (status) params.append('status', status);

  const { data } = await axiosClient.get<SiteReviewsListResponse>('/site-reviews?' + params.toString());
  return data;
}

export async function fetchSiteReviewById(id: number): Promise<SiteReviewDetailResponse> {
  const { data } = await axiosClient.get<SiteReviewDetailResponse>('/site-reviews/' + id);
  return data;
}

export async function approveSiteReview(id: number): Promise<ApiResponse<SiteReview>> {
  const { data } = await axiosClient.patch<ApiResponse<SiteReview>>('/site-reviews/' + id + '/approve');
  return data;
}

export async function rejectSiteReview(id: number): Promise<ApiResponse<SiteReview>> {
  const { data } = await axiosClient.patch<ApiResponse<SiteReview>>('/site-reviews/' + id + '/reject');
  return data;
}