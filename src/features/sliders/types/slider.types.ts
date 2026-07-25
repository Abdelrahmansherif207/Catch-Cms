export interface SliderImage {
  desktop: string | null;
  mobile: string | null;
}

export interface SliderProduct {
  id: number;
  name: string;
  slug: string;
  status: number;
  image: { thumbnail: string };
}

export interface Slider {
  id: number;
  title: string;
  slug: string;
  status: boolean;
  order: number;
  image: SliderImage;
  products?: SliderProduct[];
}

export interface SlidersListOriginal {
  data: Slider[];
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

export interface SlidersListResponse {
  status: number;
  message: string;
  success: boolean;
  data: SlidersListOriginal;
}

export interface SliderDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Slider;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface ChangeStatusResponse {
  status: number;
  message: string;
  success: boolean;
  data: Slider;
}

export interface CreateSliderData {
  'title[en]': string;
  'title[ar]': string;
  status: string;
  image_desktop?: File;
  image_mobile?: File;
  products?: number[];
}

export interface UpdateSliderData extends CreateSliderData {
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
