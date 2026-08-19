import { axiosClient } from '@/shared/api';
import type {
  ProductsListResponse,
  ProductDetailResponse,
  DeleteProductResponse,
  FetchProductsParams,
  ApiResponse,
  Product,
  ImportProductsResponse,
  ImportStatusResponse,
  ExportProductsResponse,
  DeleteAllProductsResponse,
  BulkDeleteProductsResponse,
} from '../types/product.types';

export interface CreateVariantData {
  price: number;
  quantity: number;
  sku?: string;
  attribute_values: number[];
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
}

export interface CreateProductData {
  'name[en]': string;
  'name[ar]': string;
  'description[en]'?: string;
  'description[ar]'?: string;
  product_type: string;
  price?: number;
  quantity?: number;
  in_stock: string;
  status: string;
  'categories[]'?: number[];
  'brands[]'?: number[];
  'banners[]'?: number[];
  'sliders[]'?: number[];
  has_discount: string;
  discount_status?: string;
  discount_type?: string;
  discount_amount?: number;
  start_date?: string;
  end_date?: string;
  has_flash_sale: string;
  flash_sale_id?: number;
  height?: number;
  width?: number;
  length?: number;
  weight?: number;
  'images[]'?: File[];
  variants?: CreateVariantData[];
}

export async function fetchProducts({
  page = 1,
  limit = 15,
  search,
  status,
  orderBy,
  orderDir,
  date_range,
  with: withRelations,
  category,
  banner,
  flash_sale,
  slider,
}: FetchProductsParams = {}): Promise<ProductsListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (search) params.append('search', search);
  if (status !== undefined) params.append('status', status);
  if (orderBy) params.append('orderBy', orderBy);
  if (orderDir) params.append('orderDir', orderDir);
  if (date_range) params.append('date_range', date_range);
  if (withRelations) params.append('with', withRelations);
  if (category) params.append('category', category);
  if (banner) params.append('banner', banner);
  if (flash_sale) params.append('flash_sale', flash_sale);
  if (slider) params.append('slider', slider);

  const { data } = await axiosClient.get<ProductsListResponse>('/products?' + params.toString());
  return data;
}

export async function fetchProductById(id: number): Promise<ProductDetailResponse> {
  const { data } = await axiosClient.get<ProductDetailResponse>('/products/' + id);
  return data;
}

export async function deleteProduct(id: number): Promise<DeleteProductResponse> {
  const { data } = await axiosClient.delete<DeleteProductResponse>('/products/' + id);
  return data;
}

export async function searchProducts(search: string): Promise<ProductsListResponse> {
  return fetchProducts({ search, limit: 20 });
}

export async function deleteAllProducts(): Promise<DeleteAllProductsResponse> {
  const { data } = await axiosClient.delete<DeleteAllProductsResponse>('/products/all');
  return data;
}

export async function bulkDeleteProducts(ids: number[]): Promise<BulkDeleteProductsResponse> {
  const { data } = await axiosClient.post<BulkDeleteProductsResponse>('/products/bulk-delete', { ids });
  return data;
}

export type UpdateProductData = CreateProductData & { _method: 'PUT' };

export async function updateProduct(id: number, payload: UpdateProductData): Promise<ApiResponse<Product>> {
  const formData = new FormData();

  formData.append('_method', 'PUT');
  formData.append('name[en]', payload['name[en]']);
  formData.append('name[ar]', payload['name[ar]']);
  if (payload['description[en]']) formData.append('description[en]', payload['description[en]']);
  if (payload['description[ar]']) formData.append('description[ar]', payload['description[ar]']);

  formData.append('product_type', payload.product_type);
  formData.append('in_stock', payload.in_stock);
  formData.append('status', payload.status);

  if (payload.product_type === 'simple') {
    if (payload.price !== undefined) formData.append('price', payload.price.toString());
    if (payload.quantity !== undefined) formData.append('quantity', payload.quantity.toString());
  }

  if (payload['categories[]']?.length) {
    payload['categories[]'].forEach((id) => formData.append('categories[]', id.toString()));
  }
  if (payload['brands[]']?.length) {
    payload['brands[]'].forEach((id) => formData.append('brands[]', id.toString()));
  }
  if (payload['banners[]']?.length) {
    payload['banners[]'].forEach((id) => formData.append('banners[]', id.toString()));
  }
  if (payload['sliders[]']?.length) {
    payload['sliders[]'].forEach((id) => formData.append('sliders[]', id.toString()));
  }

  formData.append('has_discount', payload.has_discount);
  if (payload.has_discount === '1') {
    if (payload.discount_status !== undefined) formData.append('discount_status', payload.discount_status);
    if (payload.discount_type) formData.append('discount_type', payload.discount_type);
    if (payload.discount_amount) formData.append('discount_amount', payload.discount_amount.toString());
    if (payload.start_date) formData.append('start_date', payload.start_date);
    if (payload.end_date) formData.append('end_date', payload.end_date);
  }

  formData.append('has_flash_sale', payload.has_flash_sale);
  if (payload.has_flash_sale === '1' && payload.flash_sale_id) {
    formData.append('flash_sale_id', payload.flash_sale_id.toString());
  }

  if (payload.product_type === 'simple') {
    if (payload.height) formData.append('height', payload.height.toString());
    if (payload.width) formData.append('width', payload.width.toString());
    if (payload.length) formData.append('length', payload.length.toString());
    if (payload.weight) formData.append('weight', payload.weight.toString());
  }

  if (payload['images[]']?.length) {
    payload['images[]'].forEach((file) => formData.append('images[]', file));
  }

  if (payload.variants?.length) {
    payload.variants.forEach((variant, i) => {
      formData.append(`variants[${i}][price]`, variant.price.toString());
      formData.append(`variants[${i}][quantity]`, variant.quantity.toString());
      if (variant.sku) formData.append(`variants[${i}][sku]`, variant.sku);
      variant.attribute_values.forEach((id) => {
        formData.append(`variants[${i}][attribute_values][]`, id.toString());
      });
      if (variant.height) formData.append(`variants[${i}][height]`, variant.height.toString());
      if (variant.width) formData.append(`variants[${i}][width]`, variant.width.toString());
      if (variant.length) formData.append(`variants[${i}][length]`, variant.length.toString());
      if (variant.weight) formData.append(`variants[${i}][weight]`, variant.weight.toString());
    });
  }

  const { data } = await axiosClient.post<ApiResponse<Product>>(`/products/${id}`, formData);
  return data;
}

export async function createProduct(payload: CreateProductData): Promise<ApiResponse<Product>> {
  const formData = new FormData();

  formData.append('name[en]', payload['name[en]']);
  formData.append('name[ar]', payload['name[ar]']);
  if (payload['description[en]']) formData.append('description[en]', payload['description[en]']);
  if (payload['description[ar]']) formData.append('description[ar]', payload['description[ar]']);

  formData.append('product_type', payload.product_type);
  formData.append('in_stock', payload.in_stock);
  formData.append('status', payload.status);

  if (payload.product_type === 'simple') {
    if (payload.price !== undefined) formData.append('price', payload.price.toString());
    if (payload.quantity !== undefined) formData.append('quantity', payload.quantity.toString());
  }

  if (payload['categories[]']?.length) {
    payload['categories[]'].forEach((id) => formData.append('categories[]', id.toString()));
  }
  if (payload['brands[]']?.length) {
    payload['brands[]'].forEach((id) => formData.append('brands[]', id.toString()));
  }
  if (payload['banners[]']?.length) {
    payload['banners[]'].forEach((id) => formData.append('banners[]', id.toString()));
  }
  if (payload['sliders[]']?.length) {
    payload['sliders[]'].forEach((id) => formData.append('sliders[]', id.toString()));
  }

  formData.append('has_discount', payload.has_discount);
  if (payload.has_discount === '1') {
    if (payload.discount_status !== undefined) formData.append('discount_status', payload.discount_status);
    if (payload.discount_type) formData.append('discount_type', payload.discount_type);
    if (payload.discount_amount) formData.append('discount_amount', payload.discount_amount.toString());
    if (payload.start_date) formData.append('start_date', payload.start_date);
    if (payload.end_date) formData.append('end_date', payload.end_date);
  }

  formData.append('has_flash_sale', payload.has_flash_sale);
  if (payload.has_flash_sale === '1' && payload.flash_sale_id) {
    formData.append('flash_sale_id', payload.flash_sale_id.toString());
  }

  if (payload.product_type === 'simple') {
    if (payload.height) formData.append('height', payload.height.toString());
    if (payload.width) formData.append('width', payload.width.toString());
    if (payload.length) formData.append('length', payload.length.toString());
    if (payload.weight) formData.append('weight', payload.weight.toString());
  }

  if (payload['images[]']?.length) {
    payload['images[]'].forEach((file) => formData.append('images[]', file));
  }

  if (payload.variants?.length) {
    payload.variants.forEach((variant, i) => {
      formData.append(`variants[${i}][price]`, variant.price.toString());
      formData.append(`variants[${i}][quantity]`, variant.quantity.toString());
      if (variant.sku) formData.append(`variants[${i}][sku]`, variant.sku);
      variant.attribute_values.forEach((id) => {
        formData.append(`variants[${i}][attribute_values][]`, id.toString());
      });
      if (variant.height) formData.append(`variants[${i}][height]`, variant.height.toString());
      if (variant.width) formData.append(`variants[${i}][width]`, variant.width.toString());
      if (variant.length) formData.append(`variants[${i}][length]`, variant.length.toString());
      if (variant.weight) formData.append(`variants[${i}][weight]`, variant.weight.toString());
    });
  }

  const { data } = await axiosClient.post<ApiResponse<Product>>('/products', formData);
  return data;
}

export async function importProducts(file: File): Promise<ImportProductsResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axiosClient.post<ImportProductsResponse>('/products/import', formData);
  return data;
}

export async function getImportStatus(importId: number): Promise<ImportStatusResponse> {
  const { data } = await axiosClient.get<ImportStatusResponse>('/products/import/' + importId);
  return data;
}

export async function downloadImportErrors(importId: number): Promise<Blob> {
  const { data } = await axiosClient.get<Blob>('/products/import/' + importId + '/download-errors', {
    responseType: 'blob',
  });
  return data;
}

export async function exportProducts(): Promise<ExportProductsResponse> {
  const { data } = await axiosClient.get<ExportProductsResponse>('/products/export', {
    responseType: 'blob',
  });
  return data;
}
