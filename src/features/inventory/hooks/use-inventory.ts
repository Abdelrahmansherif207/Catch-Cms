import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import { fetchAllPages } from '@/shared/api';
import type { ApiErrorResponse } from '@/shared/api';
import { fetchProducts } from '@/features/products/api/products.api';
import { fetchCategories } from '@/features/categories/api/categories.api';
import type { Category } from '@/features/categories/types/category.types';
import {
  emptyLocation,
  fetchInventoryOverview,
  fetchProductPlacements,
  fetchStockOperations,
  receiveStock,
  transferStock,
} from '../api/inventory.api';
import type {
  FetchProductPlacementsParams,
  ReceiveStockData,
  TransferStockData,
} from '../types/inventory.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

/**
 * Stock changes rewrite product authority numbers everywhere (lists, detail
 * views, dashboards) and mutate placements read through location detail
 * fetches — invalidate all of them on BOTH the fresh (201) and replay (200)
 * outcomes.
 */
function invalidateStockQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
}

export function useReceiveStock() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      locationId,
      payload,
    }: {
      locationId: number | string;
      payload: ReceiveStockData;
    }) => receiveStock(locationId, payload),
    onSuccess: (response) => {
      toast.success(
        response.data.replayed
          ? t('inventory.receiptReplayed')
          : t('inventory.received')
      );
      invalidateStockQueries(queryClient);
    },
    onError: (error) => {
      return handleApiError(error, t('inventory.receiveError'));
    },
  });
}

export function useTransferStock() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: TransferStockData) => transferStock(payload),
    onSuccess: (response) => {
      toast.success(
        response.data.replayed
          ? t('inventory.transferReplayed')
          : t('inventory.transferred')
      );
      invalidateStockQueries(queryClient);
    },
    onError: (error) => {
      return handleApiError(error, t('inventory.transferError'));
    },
  });
}

/** One page of the admin products index, shaped for the stock modal picker. */
export interface ProductPickerQuery {
  page: number;
  search?: string;
  status?: string;
  category?: string;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export function useReceivableProductsPage(params: ProductPickerQuery) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () =>
      fetchProducts({
        page: params.page,
        limit: 10,
        search: params.search || undefined,
        status: params.status || undefined,
        category: params.category || undefined,
        orderBy: params.orderBy || undefined,
        orderDir: params.orderDir || undefined,
      }),
    staleTime: 0,
  });
}

/** Full (all-pages) category list feeding the picker's category filter. */
export function usePickerCategories() {
  return useQuery({
    queryKey: [...queryKeys.inventory.all, 'product-picker-categories'] as const,
    queryFn: () =>
      fetchAllPages<Category>((page) =>
        fetchCategories({ page, perPage: 50 }).then((response) => ({
          data: response.data.data,
          total: response.data.total,
          last_page: response.data.last_page,
          current_page: response.data.current_page,
        }))
      ),
    staleTime: 5 * 60 * 1000,
  });
}

/** Real stats-bar source — replaces client-side derivations. */
export function useInventoryOverview(warehouseId?: number) {
  return useQuery({
    queryKey: queryKeys.inventory.overview(warehouseId),
    queryFn: () => fetchInventoryOverview(warehouseId),
    staleTime: 60 * 1000,
  });
}

/**
 * Recent-activity feed (ledger list). Lives under inventory.all, so every
 * receive/transfer/empty mutation invalidates it automatically — the feed
 * refreshes itself after each successful operation.
 */
export function useStockOperations() {
  return useQuery({
    queryKey: queryKeys.inventory.stockOperations(),
    queryFn: () => fetchStockOperations(),
    staleTime: 30 * 1000,
  });
}

/**
 * Per-product multi-location read for the transfer modal — enabled only once
 * a product is actually picked at the details step. Under inventory.all, so
 * every stock mutation invalidates it automatically.
 */
export function useProductPlacements(
  productId: number | null,
  params: FetchProductPlacementsParams = {},
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.inventory.productPlacements(productId ?? 0, params),
    queryFn: () => fetchProductPlacements(productId!, params),
    enabled: enabled && productId !== null,
    staleTime: 30 * 1000,
  });
}

/**
 * Empty-bin housekeeping (DELETE /admin/locations/{id}/products): removes
 * only zero-stock/zero-hint placement rows; the server refuses stocked or
 * picking-worked bins with verbatim translated 422s (flat — shown as toast +
 * inline refusal text), and already-empty is an idempotent 200.
 */
export function useEmptyLocation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (locationId: number | string) => emptyLocation(locationId),
    onSuccess: (response) => {
      toast.success(
        response.data.removed > 0
          ? t('inventory.emptied')
          : t('inventory.alreadyEmpty')
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
    onError: (error) => {
      return handleApiError(error, t('inventory.emptyError'));
    },
  });
}
