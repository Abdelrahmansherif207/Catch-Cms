import { axiosClient } from '@/shared/api';
import type {
  ReviewsListResponse,
  ReviewDetailResponse,
  ApiResponse,
  Review,
} from '../types/review.types';
import type { FetchReviewsParams } from '../types/review.types';

export async function fetchReviews({
  product_id,
  limit = 50,
}: FetchReviewsParams): Promise<ReviewsListResponse> {
  const params = new URLSearchParams();
  params.append('product_id', product_id.toString());
  params.append('limit', limit.toString());
  const { data } = await axiosClient.get<ReviewsListResponse>('/reviews?' + params.toString());
  return data;
}

export async function fetchReviewById(id: number): Promise<ReviewDetailResponse> {
  const { data } = await axiosClient.get<ReviewDetailResponse>('/reviews/' + id);
  return data;
}

export async function toggleApproveReview(id: number): Promise<ApiResponse<Review>> {
  const { data } = await axiosClient.patch<ApiResponse<Review>>('/reviews/' + id + '/toggle-approve');
  return data;
}

export async function deleteReview(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/reviews/' + id);
  return data;
}
