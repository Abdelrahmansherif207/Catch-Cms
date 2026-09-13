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

export type ExportResponse = Blob;

export interface BrandImportStartData {
  import_id: number;
  status: string;
}

export interface BrandImportError {
  sheet: string;
  row: number;
  name_en: string;
  name_ar: string;
  error_message: string;
}

export type BrandImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled'
  | 'cancelling';

export interface BrandImportStatusData {
  id: number;
  status: BrandImportStatus;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  progress: number;
  errors: BrandImportError[];
  error_count: number;
  created_at: string;
  completed_at: string | null;
}

export type ImportBrandsResponse = ApiResponse<BrandImportStartData>;
export type BrandImportStatusResponse = ApiResponse<BrandImportStatusData>;
export type CancelBrandImportResponse = ApiResponse<{
  import_id: number;
  status: string;
}>;

export interface BrandExportStartData {
  export_id: number;
  status: string;
}

export type BrandExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BrandExportStatusData {
  id: number;
  status: BrandExportStatus;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors: BrandImportError[];
  created_at: string;
  completed_at: string | null;
}

export type StartBrandExportResponse = ApiResponse<BrandExportStartData>;
export type BrandExportStatusResponse = ApiResponse<BrandExportStatusData>;
