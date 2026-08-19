import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchBrands,
  fetchBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  reorderBrands,
  searchProducts,
  type FetchBrandsParams,
} from '../api/brands.api';
import type { CreateBrandData, UpdateBrandData, BrandsListResponse, Brand } from '../types/brand.types';
import type { ApiErrorResponse } from '@/shared/api';

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
