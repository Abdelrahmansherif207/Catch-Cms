import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchCategories,
  fetchCategoryById,
  toggleFeatured,
  createCategory,
  updateCategory,
  deleteCategory,
  importCategories,
  getCategoryImportStatus,
  cancelCategoryImport,
  downloadCategoryImportErrors,
  downloadCategoryImportSample,
  startCategoryExport,
  getCategoryExportStatus,
  downloadCategoryExport,
  type FetchCategoriesParams,
} from '../api/categories.api';
import type {
  ApiResponse,
  CategoryDetail,
  CategoryListItem,
  CreateCategoryData,
  PaginatedResponse,
  UpdateCategoryData,
  CategoryImportStatus,
} from '../types/category.types';
import type { ApiErrorResponse } from '@/shared/api';

type CategoryCacheData = ApiResponse<
  Partial<PaginatedResponse<CategoryListItem>> & Pick<CategoryDetail, 'id' | 'is_featured'>
>;

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useCategories(params: FetchCategoriesParams = {}, enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => fetchCategories(params),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => fetchCategoryById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedCategories(page: number = 1, perPage: number = 15) {
  return useQuery({
    queryKey: queryKeys.categories.featured(page, perPage),
    queryFn: () => fetchCategories({ featureCategory: true, page, perPage }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: number) => toggleFeatured(categoryId),
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });
      const queries = queryClient.getQueriesData<CategoryCacheData>({ queryKey: queryKeys.categories.all });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queryClient.setQueriesData({ queryKey: queryKeys.categories.all }, (old: CategoryCacheData | undefined) => {
        if (!old) return old;
        if (old.data?.data && Array.isArray(old.data.data)) {
          return {
            ...old,
            data: {
              ...old.data,
              data: old.data.data.map((item) =>
                item.id === categoryId ? { ...item, is_featured: !item.is_featured } : item
              ),
            },
          };
        }
        if (old.data?.id === categoryId) {
          return { ...old, data: { ...old.data, is_featured: !old.data.is_featured } };
        }
        return old;
      });

      return { previousData };
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Category feature toggled successfully');
    },
    onError: (error, _categoryId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, 'Failed to toggle category feature');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryData) => createCategory(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Category created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create category');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryData }) =>
      updateCategory(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Category updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update category');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete category');
    },
  });
}

export type CategoryImportPhase =
  | 'idle'
  | 'uploading'
  | 'polling'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled'
  | 'timeout';

const TERMINAL_IMPORT_STATUSES: CategoryImportStatus[] = [
  'completed',
  'completed_with_errors',
  'failed',
  'cancelled',
];

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function useCategoriesImport() {
  const queryClient = useQueryClient();
  const [importId, setImportId] = useState<number | null>(null);
  const [importPhase, setImportPhase] = useState<CategoryImportPhase>('idle');

  const uploadMutation = useMutation({
    mutationFn: (file: File) => importCategories(file),
    onSuccess: (response) => {
      if (response.data?.import_id) {
        setImportId(response.data.import_id);
        setImportPhase('polling');
      }
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to import categories');
      setImportPhase('idle');
    },
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.categories.importStatus(importId!),
    queryFn: () => getCategoryImportStatus(importId!),
    enabled: importPhase === 'polling' && importId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status && TERMINAL_IMPORT_STATUSES.includes(status)) return false;
      return 1000;
    },
  });

  const status = statusQuery.data?.data ?? null;

  const cancelMutation = useMutation({
    mutationFn: () => cancelCategoryImport(importId!),
    onSuccess: (response) => {
      toast.success(response.message || 'Import cancelled successfully');
      statusQuery.refetch();
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to cancel import');
    },
  });

  useEffect(() => {
    if (
      status?.status === 'completed' ||
      status?.status === 'completed_with_errors'
    ) {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    }
  }, [status, queryClient]);

  useEffect(() => {
    if (importPhase !== 'polling') return;
    const timer = setTimeout(() => {
      setImportPhase('timeout');
    }, 180_000);
    return () => clearTimeout(timer);
  }, [importPhase]);

  const phase: CategoryImportPhase =
    importPhase === 'polling'
      ? status?.status === 'completed'
        ? 'completed'
        : status?.status === 'completed_with_errors'
          ? 'completed_with_errors'
          : status?.status === 'failed'
            ? 'failed'
            : status?.status === 'cancelled'
              ? 'cancelled'
              : 'polling'
      : importPhase;

  const downloadErrors = useCallback(async () => {
    if (!importId) return;
    try {
      const blob = await downloadCategoryImportErrors(importId);
      downloadBlob(blob, `failed_category_import_rows_${importId}.xlsx`);
    } catch {
      toast.error('No errors found');
    }
  }, [importId]);

  const downloadSample = useCallback(async () => {
    try {
      const blob = await downloadCategoryImportSample();
      downloadBlob(blob, 'category-import-sample.xlsx');
    } catch {
      toast.error('Failed to download sample template');
    }
  }, []);

  const reset = useCallback(() => {
    setImportId(null);
    setImportPhase('idle');
    uploadMutation.reset();
    cancelMutation.reset();
  }, [uploadMutation, cancelMutation]);

  return {
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    phase,
    importId,
    status,
    cancel: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
    downloadErrors,
    downloadSample,
    reset,
  };
}

export type CategoryExportPhase =
  | 'idle'
  | 'starting'
  | 'polling'
  | 'completed'
  | 'failed'
  | 'timeout';

export function useCategoriesExport() {
  const [exportId, setExportId] = useState<number | null>(null);
  const [exportPhase, setExportPhase] = useState<CategoryExportPhase>('idle');
  const downloadedRef = useRef(false);

  const startMutation = useMutation({
    mutationFn: () => startCategoryExport(),
    onSuccess: (response) => {
      if (response.data?.export_id) {
        downloadedRef.current = false;
        setExportId(response.data.export_id);
        setExportPhase('polling');
      }
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to export categories');
      setExportPhase('idle');
    },
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.categories.exportStatus(exportId!),
    queryFn: () => getCategoryExportStatus(exportId!),
    enabled: exportPhase === 'polling' && exportId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 1000;
    },
  });

  const status = statusQuery.data?.data ?? null;

  useEffect(() => {
    if (status?.status === 'completed' && !downloadedRef.current) {
      downloadedRef.current = true;
      downloadCategoryExport(status.id)
        .then((blob) => {
          downloadBlob(blob, `categories_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        })
        .catch(() => {
          handleApiError(null, 'Failed to download export file');
        });
    }
  }, [status]);

  useEffect(() => {
    if (exportPhase !== 'polling') return;
    const timer = setTimeout(() => {
      setExportPhase('timeout');
    }, 180_000);
    return () => clearTimeout(timer);
  }, [exportPhase]);

  const phase: CategoryExportPhase =
    exportPhase === 'polling'
      ? status?.status === 'completed'
        ? 'completed'
        : status?.status === 'failed'
          ? 'failed'
          : 'polling'
      : exportPhase;

  const reset = useCallback(() => {
    downloadedRef.current = false;
    setExportId(null);
    setExportPhase('idle');
    startMutation.reset();
  }, [startMutation]);

  return {
    start: startMutation.mutate,
    isStarting: startMutation.isPending,
    phase,
    exportId,
    status,
    reset,
  };
}

