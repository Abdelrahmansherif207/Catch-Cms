import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchProducts,
  fetchProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  importProducts,
  getImportStatus,
  downloadImportErrors,
  deleteAllProducts,
  bulkDeleteProducts,
  exportProducts,
  type CreateProductData,
  type UpdateProductData,
} from '../api/products.api';
import type { FetchProductsParams } from '../types/product.types';
import type { ApiErrorResponse } from '@/shared/api';

export type ImportPhase = 'idle' | 'uploading' | 'polling' | 'completed' | 'failed' | 'timeout';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useProducts(params: FetchProductsParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => fetchProducts(params),
    staleTime: 3 * 60 * 1000,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => fetchProductById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete product');
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductData) => createProduct(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Product created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create product');
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductData }) => updateProduct(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Product updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update product');
    },
  });
}

export function useProductsImport() {
  const queryClient = useQueryClient();
  const [importId, setImportId] = useState<number | null>(null);
  const [importPhase, setImportPhase] = useState<ImportPhase>('idle');

  const uploadMutation = useMutation({
    mutationFn: (file: File) => importProducts(file),
    onSuccess: (response) => {
      if (response.data?.import_id) {
        setImportId(response.data.import_id);
        setImportPhase('polling');
      }
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to import products');
      setImportPhase('idle');
    },
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.products.importStatus(importId!),
    queryFn: () => getImportStatus(importId!),
    enabled: importPhase === 'polling',
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 1000;
    },
  });

  const status = statusQuery.data?.data ?? null;

  useEffect(() => {
    if (status?.status === 'completed') {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    }
  }, [status, queryClient]);

  useEffect(() => {
    if (importPhase !== 'polling') return;
    const timer = setTimeout(() => {
      setImportPhase('timeout');
    }, 180_000);
    return () => clearTimeout(timer);
  }, [importPhase]);

  const phase: ImportPhase =
    status?.status === 'completed'
      ? 'completed'
      : status?.status === 'failed'
        ? 'failed'
        : importPhase;

  const downloadErrors = useCallback(async () => {
    if (!importId) return;
    try {
      const blob = await downloadImportErrors(importId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import_errors_${importId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.success('No errors found');
    }
  }, [importId]);

  const reset = useCallback(() => {
    setImportId(null);
    setImportPhase('idle');
    uploadMutation.reset();
  }, [uploadMutation]);

  return {
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    phase,
    importId,
    status,
    downloadErrors,
    reset,
  };
}

export function useDeleteAllProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAllProducts(),
    onSuccess: (response) => {
      toast.success(response.message || 'All products deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete all products');
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => bulkDeleteProducts(ids),
    onSuccess: (response) => {
      toast.success(response.message || 'Products deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete products');
    },
  });
}

export function useExportProducts() {
  return useMutation({
    mutationFn: () => exportProducts(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Products exported successfully');
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to export products');
    },
  });
}
