export interface BannerImage {
  desktop: string | null;
  mobile: string | null;
}

export interface BannerProduct {
  id: number;
  name: string;
  slug: string;
  status: number;
  image: { thumbnail: string };
}

export interface Banner {
  id: number;
  title: string;
  slug?: string;
  description: string;
  image: BannerImage;
  status: boolean;
  products?: BannerProduct[];
}

export interface BannersListOriginal {
  data: Banner[];
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

export interface BannersListResponse {
  status: number;
  message: string;
  success: boolean;
  data: BannersListOriginal;
}

export interface BannerDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Banner;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface CreateBannerData {
  'title[en]': string;
  'title[ar]': string;
  'description[en]': string;
  'description[ar]': string;
  image_desktop?: File;
  image_mobile?: File;
  status: string;
  products?: number[];
}

export interface UpdateBannerData {
  _method: 'PUT';
  'title[en]'?: string;
  'title[ar]'?: string;
  'description[en]'?: string;
  'description[ar]'?: string;
  image_desktop?: File;
  image_mobile?: File;
  status?: string;
  products?: number[];
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
  };
}
