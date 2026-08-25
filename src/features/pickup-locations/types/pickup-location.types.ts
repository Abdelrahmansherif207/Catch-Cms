export interface LocalizedDay {
  ar: string;
  en: string;
}

export interface WorkingHour {
  day: LocalizedDay;
  open: string;
  close: string;
}

export interface PickupLocation {
  id: number;
  store_name: string;
  address: string;
  phone: string;
  email: string;
  latitude: string | null;
  longitude: string | null;
  working_hours: WorkingHour[] | null;
  status: boolean;
  display_order: number;
  is_default: boolean;
  created_at: string;
}

export interface PaginatedData<T> {
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

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export type PickupLocationsListResponse = ApiResponse<PaginatedData<PickupLocation>>;
export type PickupLocationDetailResponse = ApiResponse<PickupLocation>;

export interface CreatePickupLocationData {
  store_name: string;
  address: string;
  phone: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  working_hours?: WorkingHour[];
  status: string;
  display_order: number;
}

export interface UpdatePickupLocationData extends Partial<CreatePickupLocationData> {
  is_default?: boolean;
}
