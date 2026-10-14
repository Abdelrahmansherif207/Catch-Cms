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
  receiveStock,
  transferStock,
} from '../api/inventory.api';
import type { ReceiveStockData, TransferStockData } from '../types/inventory.types';

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
