export interface PromotionImage {
  desktop: string | null;
  mobile: string | null;
}

export interface GiftProductInput {
  product_id: number;
  quantity: number;
  variant_id?: number;
}

export interface Promotion {
  id: number;
  name: string;
  slug: string;
  type: string;
  discount_type: string;
  value: number;
  discount: number;
  code: string | null;
  minimum_order_amount: number;
  required_quantity: number | null;
  apply_to: string;
  image: PromotionImage;
  start_at: string;
  end_at: string;
  status: boolean;
  is_valid: boolean;
  created_at: string;
}

export interface PromotionListOriginal {
  data: Promotion[];
  page: number;
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

export interface PromotionListResponse {
  status: number;
  message: string;
  success: boolean;
  data: PromotionListOriginal;
}

export interface PromotionDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Promotion;
}

export interface CreatePromotionData {
  'name[en]': string;
  'name[ar]': string;
  image_desktop?: File;
  image_mobile?: File;
  type: string;
  type_amount: string;
  discount: string;
  minimum_order_amount?: string;
  max_discount_amount?: string;
  required_quantity?: string;
  apply_to: string;
  product_ids?: number[];
  gift_products?: GiftProductInput[];
  start_at: string;
  end_at: string;
  status: string;
}

export interface UpdatePromotionData extends CreatePromotionData {
  _method: 'PUT';
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface ProductSearchResult {
  id: number;
  name: string;
}

export interface ProductsResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    data: ProductSearchResult[];
    links: {
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
    };
  };
}
