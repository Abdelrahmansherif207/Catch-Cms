export interface CouponImage {
  desktop: string | null;
  mobile: string | null;
}

export interface Coupon {
  id: number;
  code: string;
  name: string;
  image: CouponImage;
  borderColor: string | null;
  borderless: boolean;
  discount: string;
  discount_type: string;
  max_discount_amount: string | null;
  start_date: string;
  end_date: string;
  limiter: number | null;
  used: number;
  status: boolean;
  is_valid: boolean;
  created_at: string;
}

export interface CouponListOriginal {
  data: Coupon[];
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

export interface CouponListResponse {
  status: number;
  message: string;
  success: boolean;
  data: CouponListOriginal;
}

export interface CouponDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Coupon;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface CreateCouponData {
  'name[en]': string;
  'name[ar]': string;
  discount?: string;
  discount_type: string;
  max_discount_amount?: string;
  start_date: string;
  end_date: string;
  limiter?: string;
  status: string;
  border_color?: string;
  borderless?: string;
  'image-desktop': File;
  'image-mobile': File;
}

export interface UpdateCouponData {
  _method: 'PUT';
  'name[en]'?: string;
  'name[ar]'?: string;
  discount?: string;
  discount_type?: string;
  max_discount_amount?: string;
  start_date?: string;
  end_date?: string;
  limiter?: string;
  status?: string;
  border_color?: string;
  borderless?: string;
  'image-desktop'?: File;
  'image-mobile'?: File;
}

export interface CouponAssignment {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  max_uses: number;
  used: number;
  remaining: number;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
}

export interface AssignmentListOriginal {
  data: CouponAssignment[];
  current_page: number;
  from: number;
  to: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AssignmentListResponse {
  status: number;
  message: string;
  success: boolean;
  data: AssignmentListOriginal;
}

export interface CreateAssignmentPayload {
  user_id: number;
  max_uses: number;
  expires_at?: string | null;
}

export interface UpdateAssignmentPayload {
  max_uses: number;
  expires_at?: string | null;
}
