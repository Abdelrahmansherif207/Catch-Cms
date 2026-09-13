import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchBrands,
  fetchAllBrands,
  fetchBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  reorderBrands,
  searchProducts,
  importBrands,
  getBrandImportStatus,
  cancelBrandImport,
  downloadBrandImportErrors,
  downloadBrandImportSample,
  startBrandExport,
  getBrandExportStatus,
  downloadBrandExport,
  type FetchBrandsParams,
} from '../api/brands.api';
import type {
  CreateBrandData,
  UpdateBrandData,
  BrandsListResponse,
  Brand,
  BrandImportStatusData,
  BrandExportStatusData,
} from '../types/brand.types';
import type { ApiErrorResponse } from '@/shared/api';
import {
  useFileOperationSubscription,
  newIdempotencyKey,
  isTerminalFileOperationState,
  type FileOperationEventPayload,
} from '@/shared/lib/file-operations';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useBrands(params: FetchBrandsParams = {}) {
  return useQuery({
    queryKey: queryKeys.brands.list(params),
    queryFn: () => fetchBrands(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllBrands() {
  return useQuery({
    queryKey: queryKeys.brands.allList(),
    queryFn: () => fetchAllBrands(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrand(id: number) {
  return useQuery({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () => fetchBrandById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBrandData) => createBrand(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Brand created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create brand');
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBrandData }) =>
      updateBrand(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Brand updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update brand');
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteBrand(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Brand deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete brand');
    },
  });
}

export function useReorderBrands() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandIds: number[]) => reorderBrands(brandIds),
    onMutate: async (brandIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.brands.lists() });

      const queries = queryClient.getQueriesData<BrandsListResponse>({ queryKey: queryKeys.brands.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queries.forEach(([queryKey, data]) => {
        if (!data?.data?.data) return;
        const itemMap = new Map(data.data.data.map((item) => [item.id, item]));
        const reordered = brandIds
          .map((id) => itemMap.get(id))
          .filter((item): item is Brand => !!item);

        if (reordered.length === data.data.data.length) {
          queryClient.setQueryData(queryKey, {
            ...data,
            data: {
              ...data.data,
              data: reordered,
            },
          });
        }
      });

      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, 'Failed to reorder brands');
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Brands reordered successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
    },
  });
}

export function useProductSearch(search: string) {
  return useQuery({
    queryKey: queryKeys.brands.productSearch(search),
    queryFn: () => searchProducts(search),
    enabled: search.length > 0,
    staleTime: 0,
  });
}

export type BrandImportPhase =
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

export function useBrandsImport() {
  const queryClient = useQueryClient();
  const [importId, setImportId] = useState<number | null>(null);
  const [importPhase, setImportPhase] = useState<BrandImportPhase>('idle');

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
      return importBrands(file, idempotencyKeyRef.current);
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
        queryClient.setQueryData(queryKeys.brands.importStatus(id), {
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
          } satisfies BrandImportStatusData,
        });
      } else {
        setImportPhase('idle');
      }
    },
    onError: (error: unknown) => {
      inFlightRef.current = false;
      handleApiError(error, 'Failed to import brands');
      setImportPhase('idle');
    },
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.brands.importStatus(importId!),
    queryFn: () => getBrandImportStatus(importId!),
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
      const key = queryKeys.brands.importStatus(payload.operation_id);
      queryClient.setQueryData(key, (old: unknown) => {
        const prev = (old as { data?: Partial<BrandImportStatusData> } | undefined)?.data;
        const data: BrandImportStatusData = {
          id: payload.operation_id,
          status: payload.state as BrandImportStatusData['status'],
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
        queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
        // Notify even if the dialog was closed mid-job (once per operation).
        if (!toastedTerminalsRef.current.has(payload.operation_id)) {
          toastedTerminalsRef.current.add(payload.operation_id);
          const ok = payload.success_rows ?? 0;
          const failed = payload.failed_rows ?? 0;
          const total = payload.total_rows ?? payload.processed_rows ?? ok + failed;
          if (payload.state === 'completed') {
            toast.success(`Brand import completed: ${ok}/${total} rows`);
          } else if (payload.state === 'completed_with_errors') {
            toast.warning(`Brand import completed with errors: ${ok} ok, ${failed} failed`);
          } else if (payload.state === 'failed') {
            toast.error(payload.message || 'Brand import failed');
          }
        }
      }
    },
    [queryClient],
  );

  // Live updates on the pre-subscribed private-users channel (contract §33).
  const { connectionState } = useFileOperationSubscription({
    kind: 'brand-import',
    operationId: importId,
    enabled: importId !== null,
    onEvent: applyPusherEvent,
    onReconnect: () => {
      if (importId !== null) statusQuery.refetch();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBrandImport(importId!),
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

  // Synchronous same-tick guards: React state flips async, so double clicks
  // in one tick would otherwise fire duplicate requests.
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
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    }
  }, [status, queryClient]);

  // Event-driven: Pusher reports progress until the server sends a terminal
  // state (completed / failed / cancelled). Nothing here fetches on a timer.

  const phase: BrandImportPhase =
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
      const blob = await downloadBrandImportErrors(importId);
      downloadBlob(blob, `failed_brand_import_rows_${importId}.xlsx`);
    } catch {
      toast.error('No errors found');
    }
  }, [importId]);

  const downloadSample = useCallback(async () => {
    try {
      const blob = await downloadBrandImportSample();
      downloadBlob(blob, 'brand-import-sample.xlsx');
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

export type BrandExportPhase =
  | 'idle'
  | 'starting'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'timeout';

export function useBrandsExport() {
  const queryClient = useQueryClient();
  const [exportId, setExportId] = useState<number | null>(null);
  const [exportPhase, setExportPhase] = useState<BrandExportPhase>('idle');
  const downloadedRef = useRef(false);

  // One UUID per export intent (dialog session): reused across double-clicks
  // and retries so backend idempotency dedupes to a single operation.
  const idempotencyKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const toastedTerminalsRef = useRef<Set<number>>(new Set());

  const startMutation = useMutation({
    mutationFn: () => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = newIdempotencyKey();
      }
      return startBrandExport(idempotencyKeyRef.current);
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
        queryClient.setQueryData(queryKeys.brands.exportStatus(id), {
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
          } satisfies BrandExportStatusData,
        });
      } else {
        setExportPhase('idle');
      }
    },
    onError: (error: unknown) => {
      inFlightRef.current = false;
      handleApiError(error, 'Failed to export brands');
      setExportPhase('idle');
    },
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.brands.exportStatus(exportId!),
    queryFn: () => getBrandExportStatus(exportId!),
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
      const key = queryKeys.brands.exportStatus(payload.operation_id);
      queryClient.setQueryData(key, (old: unknown) => {
        const prev = (old as { data?: Partial<BrandExportStatusData> } | undefined)?.data;
        const data: BrandExportStatusData = {
          id: payload.operation_id,
          status: (payload.state === 'completed_with_errors' ? 'completed' : payload.state) as BrandExportStatusData['status'],
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
            toast.success('Brand export completed — download starting');
          } else if (payload.state === 'failed') {
            toast.error(payload.message || 'Brand export failed');
          }
        }
      }
    },
    [queryClient],
  );

  const { connectionState } = useFileOperationSubscription({
    kind: 'brand-export',
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
      downloadBrandExport(status.id)
        .then((blob) => {
          downloadBlob(blob, `brands_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        })
        .catch(() => {
          downloadedRef.current = false;
          handleApiError(null, 'Failed to download export file');
        });
    }
  }, [status]);

  // Event-driven: Pusher reports progress until the server sends a terminal
  // state (completed / failed). Nothing here fetches on a timer.

  const phase: BrandExportPhase =
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
      const blob = await downloadBrandExport(exportId);
      downloadBlob(blob, `brands_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      toast.error('Failed to download export file');
    }
  }, [exportId]);

  const reset = useCallback(() => {
    downloadedRef.current = false;
    setExportId(null);
    setExportPhase('idle');
    inFlightRef.current = false;
    idempotencyKeyRef.current = null;
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
