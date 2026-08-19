export interface Country {
  id: number;
  name: string;
  phone_code: string;
  status: boolean;
  created_at: string;
  governorates?: Governorate[];
}

export interface Governorate {
  id: number;
  country_id: number;
  name: string;
  status: boolean;
  shipping_price?: ShippingPrice | null;
  country?: Country;
  cities?: City[];
  created_at: string;
}

export interface ShippingPrice {
  id: number;
  governorate_id: number;
  price: number;
  estimated_days: number;
  free_shipping_over: number;
  status: boolean;
  created_at: string;
}

export interface City {
  id: number;
  governorate_id: number;
  name: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  from: number;
  to: number;
  last_page: number;
  path: string;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface ApiListResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T[];
}

export interface ApiPaginatedResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: PaginatedResponse<T>;
}

export interface ApiDetailResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface ApiSingleResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface CreateCountryData {
  name: { en: string; ar: string };
  phone_code: string;
  status: string;
}

export interface UpdateCountryData {
  name?: { en?: string; ar?: string };
  phone_code?: string;
  status?: string;
}

export interface CreateGovernorateData {
  name: { en: string; ar: string };
  country_id: number;
  status: string;
  shipping_price?: {
    price: number;
    estimated_days: number;
    free_shipping_over?: number;
  };
}

export interface UpdateGovernorateData {
  name?: { en?: string; ar?: string };
  country_id?: number;
  status?: string;
  shipping_price?: {
    price?: number;
    estimated_days?: number;
    free_shipping_over?: number;
  };
}

export interface CreateCityData {
  name: { en: string; ar: string };
  governorate_id?: number;
}

export interface UpdateCityData {
  name?: { en?: string; ar?: string };
  governorate_id?: number;
}

export interface BulkStatusData {
  ids: number[];
  status: string;
}
