import { axiosClient } from '@/shared/api';
import type {
  CategoriesListResponse,
  CategoryDetailResponse,
  CategoryListItem,
  CreateCategoryData,
  UpdateCategoryData,
  ApiResponse,
  ImportCategoriesResponse,
  CategoryImportStatusResponse,
  CancelCategoryImportResponse,
  StartCategoryExportResponse,
  CategoryExportStatusResponse,
  ExportResponse,
} from '../types/category.types';

export interface FetchCategoriesParams {
  page?: number;
  perPage?: number;
  search?: string;
  level?: number | null;
  parentId?: number | null;
  parentOnly?: boolean;
  featureCategory?: boolean;
}

export async function fetchCategories({
  page = 1,
  perPage = 15,
  search,
  level,
  parentId,
  parentOnly,
  featureCategory,
}: FetchCategoriesParams = {}): Promise<CategoriesListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());

  if (search) params.append('search', search);
  if (level !== undefined && level !== null) params.append('level', level.toString());
  if (parentId !== undefined && parentId !== null) params.append('parent_id', parentId.toString());
  if (parentOnly) params.append('parent', 'true');
  if (featureCategory) params.append('feature-category', 'true');

  const { data } = await axiosClient.get<CategoriesListResponse>(`/categories?${params.toString()}`);
  return data;
}

export async function fetchCategoryById(id: number): Promise<CategoryDetailResponse> {
  const { data } = await axiosClient.get<CategoryDetailResponse>(`/categories/${id}`);
  return data;
}

export async function toggleFeatured(categoryId: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.put<ApiResponse<null>>('/categories/feature', { id: categoryId });
  return data;
}

export async function createCategory(payload: CreateCategoryData): Promise<ApiResponse<CategoryListItem>> {
  const formData = new FormData();

  formData.append('name[en]', payload['name[en]']);
  formData.append('name[ar]', payload['name[ar]']);

  if (payload.details) formData.append('details', payload.details);
  if (payload['image-desktop']) formData.append('image-desktop', payload['image-desktop']);
  if (payload['image-mobile']) formData.append('image-mobile', payload['image-mobile']);
  if (payload.parent_id !== undefined && payload.parent_id !== null) {
    formData.append('parent_id', payload.parent_id.toString());
  }
  formData.append('status', payload.status);

  const { data } = await axiosClient.post<ApiResponse<CategoryListItem>>('/categories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateCategory(
  id: number,
  payload: UpdateCategoryData
): Promise<ApiResponse<CategoryListItem>> {
  const formData = new FormData();

  formData.append('_method', 'PUT');
  formData.append('name[en]', payload['name[en]']);
  formData.append('name[ar]', payload['name[ar]']);

  if (payload.details) formData.append('details', payload.details);
  if (payload['image-desktop']) formData.append('image-desktop', payload['image-desktop']);
  if (payload['image-mobile']) formData.append('image-mobile', payload['image-mobile']);
  if (payload.parent_id !== undefined && payload.parent_id !== null) {
    formData.append('parent_id', payload.parent_id.toString());
  }
  formData.append('status', payload.status);

  const { data } = await axiosClient.post<ApiResponse<CategoryListItem>>(`/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteCategory(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>(`/categories/${id}`);
  return data;
}

export async function importCategories(file: File): Promise<ImportCategoriesResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axiosClient.post<ImportCategoriesResponse>('/categories/import', formData);
  return data;
}

export async function getCategoryImportStatus(importId: number): Promise<CategoryImportStatusResponse> {
  const { data } = await axiosClient.get<CategoryImportStatusResponse>('/categories/import/' + importId);
  return data;
}

export async function cancelCategoryImport(importId: number): Promise<CancelCategoryImportResponse> {
  const { data } = await axiosClient.post<CancelCategoryImportResponse>(
    '/categories/import/' + importId + '/cancel'
  );
  return data;
}

export async function downloadCategoryImportErrors(importId: number): Promise<Blob> {
  const { data } = await axiosClient.get<Blob>(
    '/categories/import/' + importId + '/download-errors',
    { responseType: 'blob' }
  );
  return data;
}

export async function downloadCategoryImportSample(): Promise<Blob> {
  const { data } = await axiosClient.get<Blob>('/categories/import/sample', {
    responseType: 'blob',
  });
  return data;
}

export async function startCategoryExport(): Promise<StartCategoryExportResponse> {
  const { data } = await axiosClient.get<StartCategoryExportResponse>('/categories/export');
  return data;
}

export async function getCategoryExportStatus(exportId: number): Promise<CategoryExportStatusResponse> {
  const { data } = await axiosClient.get<CategoryExportStatusResponse>('/categories/export/' + exportId);
  return data;
}

export async function downloadCategoryExport(exportId: number): Promise<ExportResponse> {
  const { data } = await axiosClient.get<ExportResponse>('/categories/export/' + exportId + '/download', {
    responseType: 'blob',
  });
  return data;
}



