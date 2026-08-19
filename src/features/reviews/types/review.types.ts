export interface Review {
  id: number;
  rating: number;
  comment: string;
  images: string[];
  is_approved: boolean;
}

export interface ReviewsListResponse {
  status: number;
  message: string;
  success: boolean;
  data: Review[];
}

export interface ReviewDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Review;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface FetchReviewsParams {
  product_id: number;
  limit?: number;
}
