export interface BrandImage {
  desktop: string | null;
  mobile: string | null;
}

export interface BrandProduct {
  id: number;
  name: string;
  slug: string;
  status: number;
  image: { thumbnail: string };
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  image: BrandImage;
  details: string;
  status: boolean;
  products?: BrandProduct[];
}

export interface BrandsListOriginal {
  data: Brand[];
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

export interface BrandsListResponse {
  status: number;
  message: string;
  success: boolean;
  data: BrandsListOriginal;
}

export interface BrandDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Brand;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface CreateBrandData {
  'name[en]': string;
  'name[ar]': string;
  'image-desktop'?: File;
  'image-mobile'?: File;
  'details[en]'?: string;
  'details[ar]'?: string;
  status: string;
  products?: number[];
}

export interface UpdateBrandData extends CreateBrandData {
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
