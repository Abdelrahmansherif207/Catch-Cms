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
  CategoryImportStatusData,
  CategoryExportStatusData,
} from '../types/category.types';
import type { ApiErrorResponse } from '@/shared/api';
import {
  useFileOperationSubscription,
  isTerminalFileOperationState,
  type FileOperationEventPayload,
} from '@/shared/lib/file-operations';

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
  | 'processing'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled'
  | 'timeout';

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

  // Synchronous same-tick double-fire guard (React state updates async).
  // NOTE: category endpoints have no backend idempotency — this guard plus
  // disabled buttons is the duplicate protection.
  const inFlightRef = useRef(false);
  const cancelInFlightRef = useRef(false);
  const toastedTerminalsRef = useRef<Set<number>>(new Set());

  const uploadMutation = useMutation({
    mutationFn: (file: File) => importCategories(file),
    onMutate: () => {
      setImportPhase('uploading');
    },
    onSuccess: (response) => {
      if (response.data?.import_id) {
        const id = response.data.import_id;
        setImportId(id);
        setImportPhase('processing');
        // Seed "Queued" instantly — Pusher `queued`/`progress` events take it
        // from here. No status GET in the happy path.
        queryClient.setQueryData(queryKeys.categories.importStatus(id), {
          status: 202,
          success: true,
          message: response.message ?? '',
          data: {
            id,
            status: 'pending',
            total_rows: 0,
            processed_rows: 0,
            successful_rows: 0,
            failed_rows: 0,
            progress: 0,
            errors: [],
            error_count: 0,
            created_at: new Date().toISOString(),
            completed_at: null,
          } satisfies CategoryImportStatusData,
        });
      } else {
        setImportPhase('idle');
      }
    },
    onError: (error: unknown) => {
      inFlightRef.current = false;
      handleApiError(error, 'Failed to import categories');
      setImportPhase('idle');
    },
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.categories.importStatus(importId!),
    queryFn: () => getCategoryImportStatus(importId!),
    // Event-driven only: Pusher writes progress into this cache. The query
    // never fetches on its own — `refetch()` is called manually for recovery
    // (reconnect) and after user-initiated cancel.
    enabled: false,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  const status = statusQuery.data?.data ?? null;

  const applyPusherEvent = useCallback(
    (payload: FileOperationEventPayload) => {
      const key = queryKeys.categories.importStatus(payload.operation_id);
      queryClient.setQueryData(key, (old: unknown) => {
        const prev = (old as { data?: Partial<CategoryImportStatusData> } | undefined)?.data;
        const data: CategoryImportStatusData = {
          id: payload.operation_id,
          status: payload.state as CategoryImportStatusData['status'],
          total_rows: payload.total_rows ?? prev?.total_rows ?? 0,
          processed_rows: payload.processed_rows ?? 0,
          successful_rows: payload.success_rows ?? 0,
          failed_rows: payload.failed_rows ?? 0,
          progress: payload.progress ?? prev?.progress ?? 0,
          errors: prev?.errors ?? [],
          error_count: payload.failed_rows ?? prev?.error_count ?? 0,
          created_at: prev?.created_at ?? new Date().toISOString(),
          completed_at: isTerminalFileOperationState(payload.state)
            ? (prev?.completed_at ?? new Date().toISOString())
            : null,
        };
        const base = (old as Record<string, unknown> | undefined) ?? {};
        return { status: 200, success: true, message: payload.message ?? '', ...base, data };
      });
      if (isTerminalFileOperationState(payload.state)) {
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
        // Notify even if the dialog was closed mid-job (once per operation).
        if (!toastedTerminalsRef.current.has(payload.operation_id)) {
          toastedTerminalsRef.current.add(payload.operation_id);
          const ok = payload.success_rows ?? 0;
          const failed = payload.failed_rows ?? 0;
          const total = payload.total_rows ?? payload.processed_rows ?? ok + failed;
          if (payload.state === 'completed') {
            toast.success(`Category import completed: ${ok}/${total} rows`);
          } else if (payload.state === 'completed_with_errors') {
            toast.warning(`Category import completed with errors: ${ok} ok, ${failed} failed`);
          } else if (payload.state === 'failed') {
            toast.error(payload.message || 'Category import failed');
          }
        }
      }
    },
    [queryClient],
  );

  const { connectionState } = useFileOperationSubscription({
    kind: 'category-import',
    operationId: importId,
    enabled: importId !== null,
    onEvent: applyPusherEvent,
    onReconnect: () => {
      if (importId !== null) statusQuery.refetch();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelCategoryImport(importId!),
    onSuccess: (response) => {
      toast.success(response.message || 'Import cancelled successfully');
      // One-shot recovery; terminal `cancelled` arrives via Pusher.
      statusQuery.refetch();
    },
    onError: (error: unknown) => {
      cancelInFlightRef.current = false;
      handleApiError(error, 'Failed to cancel import');
    },
  });

  const upload = useCallback(
    (file: File) => {
      if (inFlightRef.current || uploadMutation.isPending) return;
      inFlightRef.current = true;
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );
  const cancel = useCallback(() => {
    if (cancelInFlightRef.current || cancelMutation.isPending || importId === null) return;
    cancelInFlightRef.current = true;
    cancelMutation.mutate();
  }, [cancelMutation, importId]);

  useEffect(() => {
    if (
      status?.status === 'completed' ||
      status?.status === 'completed_with_errors'
    ) {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    }
  }, [status, queryClient]);

  // Event-driven: Pusher reports progress until the server sends a terminal
  // state (completed / failed / cancelled). Nothing here fetches on a timer.

  const phase: CategoryImportPhase =
    importPhase === 'processing'
      ? status?.status === 'completed'
        ? 'completed'
        : status?.status === 'completed_with_errors'
          ? 'completed_with_errors'
          : status?.status === 'failed'
            ? 'failed'
            : status?.status === 'cancelled'
              ? 'cancelled'
              : 'processing'
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
    inFlightRef.current = false;
    cancelInFlightRef.current = false;
    toastedTerminalsRef.current.clear();
    uploadMutation.reset();
    cancelMutation.reset();
  }, [uploadMutation, cancelMutation]);

  return {
    upload,
    isUploading: uploadMutation.isPending,
    phase,
    importId,
    status,
    connectionState,
    cancel,
    isCancelling: cancelMutation.isPending,
    downloadErrors,
    downloadSample,
    reset,
  };
}

export type CategoryExportPhase =
  | 'idle'
  | 'starting'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'timeout';

export function useCategoriesExport() {
  const queryClient = useQueryClient();
  const [exportId, setExportId] = useState<number | null>(null);
  const [exportPhase, setExportPhase] = useState<CategoryExportPhase>('idle');
  const downloadedRef = useRef(false);
  const inFlightRef = useRef(false);
  const toastedTerminalsRef = useRef<Set<number>>(new Set());

  const startMutation = useMutation({
    mutationFn: () => startCategoryExport(),
    onMutate: () => {
      setExportPhase('starting');
    },
    onSuccess: (response) => {
      if (response.data?.export_id) {
        const id = response.data.export_id;
        downloadedRef.current = false;
        setExportId(id);
        setExportPhase('processing');
        // Seed "Queued" instantly — Pusher `queued`/`progress` events take it
        // from here. No status GET in the happy path.
        queryClient.setQueryData(queryKeys.categories.exportStatus(id), {
          status: 202,
          success: true,
          message: response.message ?? '',
          data: {
            id,
            status: 'pending',
            total_rows: 0,
            processed_rows: 0,
            successful_rows: 0,
            failed_rows: 0,
            errors: [],
            created_at: new Date().toISOString(),
            completed_at: null,
          } satisfies CategoryExportStatusData,
        });
      } else {
        setExportPhase('idle');
      }
    },
    onError: (error: unknown) => {
      inFlightRef.current = false;
      handleApiError(error, 'Failed to export categories');
      setExportPhase('idle');
    },
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.categories.exportStatus(exportId!),
    queryFn: () => getCategoryExportStatus(exportId!),
    // Event-driven only: Pusher writes progress into this cache. The query
    // never fetches on its own — `refetch()` is manual recovery (reconnect).
    enabled: false,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  const status = statusQuery.data?.data ?? null;

  const applyExportEvent = useCallback(
    (payload: FileOperationEventPayload) => {
      const key = queryKeys.categories.exportStatus(payload.operation_id);
      queryClient.setQueryData(key, (old: unknown) => {
        const prev = (old as { data?: Partial<CategoryExportStatusData> } | undefined)?.data;
        const data: CategoryExportStatusData = {
          id: payload.operation_id,
          status: (payload.state === 'completed_with_errors' ? 'completed' : payload.state) as CategoryExportStatusData['status'],
          total_rows: payload.total_rows ?? prev?.total_rows ?? 0,
          processed_rows: payload.processed_rows ?? 0,
          successful_rows: payload.success_rows ?? 0,
          failed_rows: payload.failed_rows ?? 0,
          errors: prev?.errors ?? [],
          created_at: prev?.created_at ?? new Date().toISOString(),
          completed_at: isTerminalFileOperationState(payload.state)
            ? (prev?.completed_at ?? new Date().toISOString())
            : null,
        };
        const base = (old as Record<string, unknown> | undefined) ?? {};
        return { status: 200, success: true, message: payload.message ?? '', ...base, data };
      });
      if (isTerminalFileOperationState(payload.state)) {
        // Notify even if the dialog was closed mid-job (once per operation).
        if (!toastedTerminalsRef.current.has(payload.operation_id)) {
          toastedTerminalsRef.current.add(payload.operation_id);
          if (payload.state === 'completed' || payload.state === 'completed_with_errors') {
            toast.success('Category export completed — download starting');
          } else if (payload.state === 'failed') {
            toast.error(payload.message || 'Category export failed');
          }
        }
      }
    },
    [queryClient],
  );

  const { connectionState } = useFileOperationSubscription({
    kind: 'category-export',
    operationId: exportId,
    enabled: exportId !== null,
    onEvent: applyExportEvent,
    onReconnect: () => {
      if (exportId !== null) statusQuery.refetch();
    },
  });

  useEffect(() => {
    if (status?.status === 'completed' && !downloadedRef.current) {
      downloadedRef.current = true;
      downloadCategoryExport(status.id)
        .then((blob) => {
          downloadBlob(blob, `categories_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        })
        .catch(() => {
          downloadedRef.current = false;
          handleApiError(null, 'Failed to download export file');
        });
    }
  }, [status]);

  // Event-driven: Pusher reports progress until the server sends a terminal
  // state (completed / failed). Nothing here fetches on a timer.

  const phase: CategoryExportPhase =
    exportPhase === 'processing'
      ? status?.status === 'completed'
        ? 'completed'
        : status?.status === 'failed'
          ? 'failed'
          : 'processing'
      : exportPhase;

  // Synchronous same-tick guard: React state flips async, so double clicks
  // in one tick would otherwise start duplicate exports.
  const start = useCallback(() => {
    if (inFlightRef.current || startMutation.isPending) return;
    inFlightRef.current = true;
    startMutation.mutate();
  }, [startMutation]);

  const download = useCallback(async () => {
    if (!exportId) return;
    try {
      const blob = await downloadCategoryExport(exportId);
      downloadBlob(blob, `categories_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      toast.error('Failed to download export file');
    }
  }, [exportId]);

  const reset = useCallback(() => {
    downloadedRef.current = false;
    setExportId(null);
    setExportPhase('idle');
    inFlightRef.current = false;
    toastedTerminalsRef.current.clear();
    startMutation.reset();
  }, [startMutation]);

  return {
    start,
    isStarting: startMutation.isPending,
    phase,
    exportId,
    status,
    connectionState,
    download,
    reset,
  };
}

