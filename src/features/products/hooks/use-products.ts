import { useState, useEffect, useCallback, useRef } from 'react';
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
  cancelProductImport,
  downloadImportErrors,
  downloadProductImportSample,
  startProductExport,
  getProductExportStatus,
  downloadProductExport,
  deleteAllProducts,
  bulkDeleteProducts,
  type CreateProductData,
  type UpdateProductData,
} from '../api/products.api';
import type {
  FetchProductsParams,
  ImportStatusData,
  ProductExportFilters,
  ProductExportStatusData,
} from '../types/product.types';
import type { ApiErrorResponse } from '@/shared/api';
import {
  useFileOperationSubscription,
  newIdempotencyKey,
  isTerminalFileOperationState,
  type FileOperationEventPayload,
} from '@/shared/lib/file-operations';

export type ImportPhase =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelling'
  | 'cancelled'
  | 'timeout';

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

  // One UUID per user intent (selected file): reused across double-clicks and
  // retries so backend idempotency dedupes to a single operation. New file or
  // reset() starts a new intent with a fresh key.
  const idempotencyKeyRef = useRef<string | null>(null);
  const lastFileRef = useRef<File | null>(null);
  // Synchronous same-tick double-fire guard (React state updates async).
  const inFlightRef = useRef(false);
  const cancelInFlightRef = useRef(false);
  const toastedTerminalsRef = useRef<Set<number>>(new Set());

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      if (lastFileRef.current !== file || !idempotencyKeyRef.current) {
        idempotencyKeyRef.current = newIdempotencyKey();
        lastFileRef.current = file;
      }
      return importProducts(file, idempotencyKeyRef.current);
    },
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
        queryClient.setQueryData(queryKeys.products.importStatus(id), {
          status: 202,
          success: true,
          message: response.message ?? '',
          data: {
            id,
            status: 'pending',
            total_rows: null,
            processed_rows: 0,
            success_rows: 0,
            successful_rows: 0,
            failed_rows: 0,
            progress: 0,
            errors: [],
          } satisfies ImportStatusData,
        });
      } else {
        setImportPhase('idle');
      }
    },
    onError: (error: unknown) => {
      inFlightRef.current = false;
      handleApiError(error, 'Failed to import products');
      setImportPhase('idle');
    },
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.products.importStatus(importId!),
    queryFn: () => getImportStatus(importId!),
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
      const key = queryKeys.products.importStatus(payload.operation_id);
      queryClient.setQueryData(key, (old: unknown) => {
        const prev = (old as { data?: Partial<ImportStatusData> } | undefined)?.data;
        const data: ImportStatusData = {
          id: payload.operation_id,
          status: payload.state as ImportStatusData['status'],
          total_rows: payload.total_rows ?? prev?.total_rows ?? null,
          processed_rows: payload.processed_rows ?? 0,
          success_rows: payload.success_rows ?? 0,
          successful_rows: payload.success_rows ?? 0,
          failed_rows: payload.failed_rows ?? 0,
          progress: payload.progress ?? prev?.progress ?? 0,
          errors: prev?.errors ?? [],
        };
        const base = (old as Record<string, unknown> | undefined) ?? {};
        return { status: 200, success: true, message: payload.message ?? '', ...base, data };
      });
      if (isTerminalFileOperationState(payload.state)) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
        // Notify even if the dialog was closed mid-job (once per operation).
        if (!toastedTerminalsRef.current.has(payload.operation_id)) {
          toastedTerminalsRef.current.add(payload.operation_id);
          const ok = payload.success_rows ?? 0;
          const failed = payload.failed_rows ?? 0;
          const total = payload.total_rows ?? payload.processed_rows ?? ok + failed;
          if (payload.state === 'completed') {
            toast.success(`Product import completed: ${ok}/${total} rows`);
          } else if (payload.state === 'completed_with_errors') {
            toast.warning(`Product import completed with errors: ${ok} ok, ${failed} failed`);
          } else if (payload.state === 'failed') {
            toast.error(payload.message || 'Product import failed');
          }
        }
      }
    },
    [queryClient],
  );

  const { connectionState } = useFileOperationSubscription({
    kind: 'product-import',
    operationId: importId,
    enabled: importId !== null,
    onEvent: applyPusherEvent,
    onReconnect: () => {
      if (importId !== null) statusQuery.refetch();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelProductImport(importId!),
    onSuccess: (response) => {
      toast.success(response.message || 'Import cancelled successfully');
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

  // Event-driven: Pusher reports progress until the server sends a terminal
  // state (completed / failed / cancelled). Nothing here fetches on a timer.

  const phase: ImportPhase =
    importPhase === 'processing'
      ? status?.status === 'completed'
        ? 'completed'
        : status?.status === 'completed_with_errors'
          ? 'completed_with_errors'
          : status?.status === 'failed'
            ? 'failed'
            : status?.status === 'cancelled'
              ? 'cancelled'
              : status?.status === 'cancelling'
                ? 'cancelling'
                : 'processing'
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
      toast.error('No errors found');
    }
  }, [importId]);

  const downloadSample = useCallback(async () => {
    try {
      const blob = await downloadProductImportSample();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-import-sample.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download sample template');
    }
  }, []);

  const reset = useCallback(() => {
    setImportId(null);
    setImportPhase('idle');
    inFlightRef.current = false;
    cancelInFlightRef.current = false;
    idempotencyKeyRef.current = null;
    lastFileRef.current = null;
    toastedTerminalsRef.current.clear();
    uploadMutation.reset();
    cancelMutation.reset();
  }, [uploadMutation, cancelMutation]);

  return {
    upload,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
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

export type ProductExportPhase =
  | 'idle'
  | 'starting'
  | 'processing'
  | 'completed'
  | 'failed'
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

export function useExportProducts() {
  const queryClient = useQueryClient();
  const [exportId, setExportId] = useState<number | null>(null);
  const [exportPhase, setExportPhase] = useState<ProductExportPhase>('idle');
  const downloadedRef = useRef(false);

  // One UUID per export intent (dialog session): reused across double-clicks
  // and retries so backend idempotency dedupes to a single operation.
  const idempotencyKeyRef = useRef<string | null>(null);
  const lastFiltersKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const toastedTerminalsRef = useRef<Set<number>>(new Set());

  const startMutation = useMutation({
    mutationFn: (filters: ProductExportFilters = {}) => {
      const filtersKey = JSON.stringify(filters);
      if (lastFiltersKeyRef.current !== filtersKey || !idempotencyKeyRef.current) {
        idempotencyKeyRef.current = newIdempotencyKey();
        lastFiltersKeyRef.current = filtersKey;
      }
      return startProductExport(filters, idempotencyKeyRef.current);
    },
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
        queryClient.setQueryData(queryKeys.products.exportStatus(id), {
          status: 202,
          success: true,
          message: response.message ?? '',
          data: {
            id,
            status: 'pending',
            total_rows: null,
            processed_rows: 0,
            successful_rows: 0,
            failed_rows: 0,
            progress: 0,
            errors: [],
            error_count: 0,
            created_at: new Date().toISOString(),
            completed_at: null,
          } satisfies ProductExportStatusData,
        });
      } else {
        setExportPhase('idle');
      }
    },
    onError: (error: unknown) => {
      inFlightRef.current = false;
      handleApiError(error, 'Failed to export products');
      setExportPhase('idle');
    },
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.products.exportStatus(exportId!),
    queryFn: () => getProductExportStatus(exportId!),
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
      const key = queryKeys.products.exportStatus(payload.operation_id);
      queryClient.setQueryData(key, (old: unknown) => {
        const prev = (old as { data?: Partial<ProductExportStatusData> } | undefined)?.data;
        const data: ProductExportStatusData = {
          id: payload.operation_id,
          status: (payload.state === 'completed_with_errors' ? 'completed' : payload.state) as ProductExportStatusData['status'],
          total_rows: payload.total_rows ?? prev?.total_rows ?? null,
          processed_rows: payload.processed_rows ?? 0,
          successful_rows: payload.success_rows ?? 0,
          failed_rows: payload.failed_rows ?? 0,
          progress: payload.progress ?? prev?.progress ?? 0,
          errors: prev?.errors ?? [],
          error_count: prev?.error_count ?? 0,
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
            toast.success('Product export completed — download starting');
          } else if (payload.state === 'failed') {
            toast.error(payload.message || 'Product export failed');
          }
        }
      }
    },
    [queryClient],
  );

  const { connectionState } = useFileOperationSubscription({
    kind: 'product-export',
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
      downloadProductExport(status.id)
        .then((blob) => {
          downloadBlob(blob, `products_export_${new Date().toISOString().split('T')[0]}.xlsx`);
          toast.success('Products exported successfully');
        })
        .catch(() => {
          downloadedRef.current = false;
          handleApiError(null, 'Failed to download export file');
        });
    }
  }, [status]);

  // Export never aborts client-side — Pusher drives progress until terminal.

  const phase: ProductExportPhase =
    exportPhase === 'processing'
      ? status?.status === 'completed'
        ? 'completed'
        : status?.status === 'failed'
          ? 'failed'
          : 'processing'
      : exportPhase;

  // Synchronous same-tick guard: React state flips async, so double clicks
  // in one tick would otherwise start duplicate exports.
  const start = useCallback(
    (filters: ProductExportFilters = {}) => {
      if (inFlightRef.current || startMutation.isPending) return;
      inFlightRef.current = true;
      startMutation.mutate(filters);
    },
    [startMutation],
  );

  const reset = useCallback(() => {
    downloadedRef.current = false;
    setExportId(null);
    setExportPhase('idle');
    inFlightRef.current = false;
    idempotencyKeyRef.current = null;
    lastFiltersKeyRef.current = null;
    toastedTerminalsRef.current.clear();
    startMutation.reset();
  }, [startMutation]);

  const download = useCallback(async () => {
    if (!exportId) return;
    try {
      const blob = await downloadProductExport(exportId);
      downloadBlob(blob, `products_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      toast.error('Failed to download export file');
    }
  }, [exportId]);

  return {
    start,
    isStarting: startMutation.isPending,
    // Backward compat aliases.
    mutate: start,
    isPending: startMutation.isPending,
    phase,
    exportId,
    status,
    connectionState,
    download,
    reset,
  };
}
