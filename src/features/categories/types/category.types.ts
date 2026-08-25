export interface CategoryImage {
  desktop: string | null;
  mobile: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  level: number;
  image: CategoryImage;
  products_count: number;
  details?: string;
  is_featured?: boolean;
  status: boolean;
}

export interface CategoryProduct {
  id: number;
  name: string;
  slug: string;
  status: number;
  image: { thumbnail?: string } | null;
}

export interface CategoryDetail extends Category {
  parent: Pick<Category, 'id' | 'name' | 'slug'> | null;
  children: Pick<Category, 'id' | 'name' | 'slug'>[];
  products?: CategoryProduct[];
}

export interface CategoryListItem {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  level: number;
  image: CategoryImage;
  products_count: number;
  details?: string;
  is_featured?: boolean;
  status: boolean;
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
  last_page_url: string;
  first_page_url: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export type CategoriesListResponse = ApiResponse<PaginatedResponse<CategoryListItem>>;
export type CategoryDetailResponse = ApiResponse<CategoryDetail>;

export interface CreateCategoryData {
  'name[en]': string;
  'name[ar]': string;
  details?: string;
  'image-desktop'?: File;
  'image-mobile'?: File;
  parent_id?: number | null;
  status: string;
}

export interface UpdateCategoryData extends CreateCategoryData {
  _method: 'PUT';
}

export type ExportResponse = Blob;

export interface CategoryImportStartData {
  import_id: number;
  status: string;
}

export interface CategoryImportError {
  sheet: string;
  row: number;
  name_en: string;
  name_ar: string;
  parent_name_en: string;
  error_message: string;
}

export type CategoryImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled'
  | 'cancelling';

export interface CategoryImportStatusData {
  id: number;
  status: CategoryImportStatus;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  progress: number;
  errors: CategoryImportError[];
  error_count: number;
  created_at: string;
  completed_at: string | null;
}

export type ImportCategoriesResponse = ApiResponse<CategoryImportStartData>;
export type CategoryImportStatusResponse = ApiResponse<CategoryImportStatusData>;
export type CancelCategoryImportResponse = ApiResponse<{
  import_id: number;
  status: string;
}>;

export interface CategoryExportStartData {
  export_id: number;
  status: string;
}

export type CategoryExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CategoryExportStatusData {
  id: number;
  status: CategoryExportStatus;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors: CategoryImportError[];
  created_at: string;
  completed_at: string | null;
}

export type StartCategoryExportResponse = ApiResponse<CategoryExportStartData>;
export type CategoryExportStatusResponse = ApiResponse<CategoryExportStatusData>;

