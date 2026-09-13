import { NO_TIMEOUT } from '@/shared/constants/api';
import { axiosClient, fetchAllPages } from '@/shared/api';
import type {
  BrandsListResponse,
  BrandDetailResponse,
  CreateBrandData,
  UpdateBrandData,
  ApiResponse,
  Brand,
  ProductsResponse,
  ImportBrandsResponse,
  BrandImportStatusResponse,
  CancelBrandImportResponse,
  StartBrandExportResponse,
  BrandExportStatusResponse,
  ExportResponse,
} from '../types/brand.types';

export interface FetchBrandsParams {
  page?: number;
  perPage?: number;
  search?: string;
  active?: boolean;
  inactive?: boolean;
  order?: string;
  sortedBy?: string;
}

export async function fetchBrands({
  page = 1,
  perPage = 15,
  search,
  active,
  inactive,
  order,
  sortedBy,
}: FetchBrandsParams = {}): Promise<BrandsListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());

  if (search) params.append('search', search);
  if (active !== undefined) params.append('active', active ? '1' : '0');
  if (inactive !== undefined) params.append('inactive', inactive ? '1' : '0');
  if (order) params.append('order', order);
  if (sortedBy) params.append('sortedBy', sortedBy);

  const { data } = await axiosClient.get<BrandsListResponse>('/brands?' + params.toString());
  return data;
}

export async function fetchAllBrands(): Promise<Brand[]> {
  return fetchAllPages((page) =>
    fetchBrands({ page, perPage: 200 }).then((res) => res.data),
  );
}

export async function fetchBrandById(id: number): Promise<BrandDetailResponse> {
  const { data } = await axiosClient.get<BrandDetailResponse>('/brands/' + id);
  return data;
}

export async function createBrand(payload: CreateBrandData): Promise<ApiResponse<Brand>> {
  const formData = new FormData();

  formData.append('name[en]', payload['name[en]']);
  formData.append('name[ar]', payload['name[ar]']);
  formData.append('status', payload.status);

  if (payload['details[en]']) formData.append('details[en]', payload['details[en]']);
  if (payload['details[ar]']) formData.append('details[ar]', payload['details[ar]']);
  if (payload['image-desktop']) formData.append('image-desktop', payload['image-desktop']);
  if (payload['image-mobile']) formData.append('image-mobile', payload['image-mobile']);
  if (payload.products && payload.products.length > 0) {
    payload.products.forEach((id) => formData.append('products[]', id.toString()));
  }

  const { data } = await axiosClient.post<ApiResponse<Brand>>('/brands', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateBrand(
  id: number,
  payload: UpdateBrandData
): Promise<ApiResponse<Brand>> {
  const formData = new FormData();

  formData.append('_method', 'PUT');
  formData.append('name[en]', payload['name[en]']);
  formData.append('name[ar]', payload['name[ar]']);
  formData.append('status', payload.status);

  if (payload['details[en]']) formData.append('details[en]', payload['details[en]']);
  if (payload['details[ar]']) formData.append('details[ar]', payload['details[ar]']);
  if (payload['image-desktop']) formData.append('image-desktop', payload['image-desktop']);
  if (payload['image-mobile']) formData.append('image-mobile', payload['image-mobile']);
  if (payload.products && payload.products.length > 0) {
    payload.products.forEach((id) => formData.append('products[]', id.toString()));
  }

  const { data } = await axiosClient.post<ApiResponse<Brand>>('/brands/' + id, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteBrand(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/brands/' + id);
  return data;
}

export async function reorderBrands(brandIds: number[]): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.put<ApiResponse<null>>('/brands/reorder', { brands: brandIds });
  return data;
}

export async function searchProducts(search: string): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('per_page', '20');
  const { data } = await axiosClient.get<ProductsResponse>('/products?' + params.toString());
  return data;
}

export async function importBrands(file: File, idempotencyKey?: string): Promise<ImportBrandsResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axiosClient.post<ImportBrandsResponse>('/brands/import', formData, {
    timeout: NO_TIMEOUT,
    ...(idempotencyKey
      ? { headers: { 'Idempotency-Key': idempotencyKey, 'X-Idempotency-Key': idempotencyKey } }
      : {}),
  });
  return data;
}

export async function getBrandImportStatus(importId: number): Promise<BrandImportStatusResponse> {
  const { data } = await axiosClient.get<BrandImportStatusResponse>('/brands/import/' + importId, {
    timeout: NO_TIMEOUT,
  });
  return data;
}

export async function cancelBrandImport(importId: number): Promise<CancelBrandImportResponse> {
  const { data } = await axiosClient.post<CancelBrandImportResponse>(
    '/brands/import/' + importId + '/cancel',
    undefined,
    { timeout: NO_TIMEOUT }
  );
  return data;
}

export async function downloadBrandImportErrors(importId: number): Promise<Blob> {
  const { data } = await axiosClient.get<Blob>(
    '/brands/import/' + importId + '/download-errors',
    { responseType: 'blob', timeout: NO_TIMEOUT }
  );
  return data;
}

export async function downloadBrandImportSample(): Promise<Blob> {
  const { data } = await axiosClient.get<Blob>('/brands/import/sample', {
    responseType: 'blob',
    timeout: NO_TIMEOUT,
  });
  return data;
}

export async function startBrandExport(idempotencyKey?: string): Promise<StartBrandExportResponse> {
  const { data } = await axiosClient.get<StartBrandExportResponse>('/brands/export', {
    timeout: NO_TIMEOUT,
    ...(idempotencyKey
      ? { headers: { 'Idempotency-Key': idempotencyKey, 'X-Idempotency-Key': idempotencyKey } }
      : {}),
  });
  return data;
}

export async function getBrandExportStatus(exportId: number): Promise<BrandExportStatusResponse> {
  const { data } = await axiosClient.get<BrandExportStatusResponse>('/brands/export/' + exportId, {
    timeout: NO_TIMEOUT,
  });
  return data;
}

export async function downloadBrandExport(exportId: number): Promise<ExportResponse> {
  const { data } = await axiosClient.get<ExportResponse>('/brands/export/' + exportId + '/download', {
    responseType: 'blob',
    timeout: NO_TIMEOUT,
  });
  return data;
}
