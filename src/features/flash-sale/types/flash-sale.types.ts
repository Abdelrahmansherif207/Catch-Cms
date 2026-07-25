export interface FlashSaleImage {
  desktop: string | null;
  mobile: string | null;
}

export interface FlashSaleProduct {
  id: number;
  name: string;
  slug: string;
  status: number;
  image: { thumbnail: string };
}

export interface FlashSale {
  id: number;
  title: string;
  slug: string;
  image: FlashSaleImage;
  description: string;
  start_date: string;
  end_date: string;
  status: boolean;
  is_valid: boolean;
  type: string;
  discount: string;
  max_discount_amount: string | null;
  created_at: string;
  products?: FlashSaleProduct[];
}

export interface FlashSaleListOriginal {
  data: FlashSale[];
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

export interface FlashSaleListResponse {
  status: number;
  message: string;
  success: boolean;
  data: FlashSaleListOriginal;
}

export interface FlashSaleDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: FlashSale;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface CreateFlashSaleData {
  'title[en]': string;
  'title[ar]': string;
  'description[en]'?: string;
  'description[ar]'?: string;
  start_date: string;
  end_date: string;
  type: string;
  discount: string;
  max_discount_amount?: string;
  status: string;
  'image-desktop'?: File;
  'image-mobile'?: File;
  products?: number[];
}

export interface UpdateFlashSaleData extends CreateFlashSaleData {
  _method: 'PUT';
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
