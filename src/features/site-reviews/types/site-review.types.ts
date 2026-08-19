export type SiteReviewStatus = 'pending' | 'approved' | 'rejected';

export interface SiteReviewCustomer {
  id: number;
  name: string;
  email: string;
}

export interface SiteReviewModerator {
  id: number;
  name: string;
}

export interface SiteReview {
  id: number;
  user_id: number;
  customer: SiteReviewCustomer | null;
  rating: number;
  title: string;
  comment: string;
  status: SiteReviewStatus;
  moderator: SiteReviewModerator | null;
  moderated_at: string | null;
  created_at: string;
}

export interface SiteReviewPagination {
  current_page: number;
  from: number;
  to: number;
  last_page: number;
  path: string;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  last_page_url: string;
  first_page_url: string;
}

export interface SiteReviewsListResponse {
  status: number;
  message: string;
  success: boolean;
  data: SiteReviewPagination & { data: SiteReview[] };
}

export interface SiteReviewDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: SiteReview;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}