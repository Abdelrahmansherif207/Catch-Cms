import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchFlashSales,
  fetchFlashSaleById,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  reorderFlashSales,
  searchProducts,
  type FetchFlashSalesParams,
} from '../api/flash-sale.api';
import type { CreateFlashSaleData, UpdateFlashSaleData } from '../types/flash-sale.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useFlashSales(params: FetchFlashSalesParams = {}, enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.flashSales.list(params),
    queryFn: () => fetchFlashSales(params),
    staleTime: 3 * 60 * 1000,
    enabled,
  });
}

export function useFlashSale(id: number) {
  return useQuery({
    queryKey: queryKeys.flashSales.detail(id),
    queryFn: () => fetchFlashSaleById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateFlashSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFlashSaleData) => createFlashSale(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Flash sale created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.flashSales.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create flash sale');
    },
  });
}

export function useUpdateFlashSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFlashSaleData }) =>
      updateFlashSale(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Flash sale updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.flashSales.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.flashSales.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update flash sale');
    },
  });
}

export function useDeleteFlashSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteFlashSale(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Flash sale deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.flashSales.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete flash sale');
    },
  });
}

export function useReorderFlashSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flashSaleIds: number[]) => reorderFlashSales(flashSaleIds),
    onMutate: async (flashSaleIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.flashSales.lists() });
      const queries = queryClient.getQueriesData<any>({ queryKey: queryKeys.flashSales.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queries.forEach(([queryKey, data]) => {
        if (!data?.data?.data) return;
        const itemMap = new Map(data.data.data.map((item: any) => [item.id, item]));
        const reordered = flashSaleIds
          .map((id) => itemMap.get(id))
          .filter(Boolean);

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
    onSuccess: (response) => {
      toast.success(response.message || 'Flash sales reordered successfully');
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, 'Failed to reorder flash sales');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashSales.lists() });
    },
  });
}

export function useProductSearch(search: string) {
  return useQuery({
    queryKey: queryKeys.flashSales.productSearch(search),
    queryFn: () => searchProducts(search),
    enabled: search.length > 0,
    staleTime: 0,
  });
}
