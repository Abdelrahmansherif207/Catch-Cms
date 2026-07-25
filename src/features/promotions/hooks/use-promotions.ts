import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchPromotions,
  fetchPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  searchProducts,
  type FetchPromotionsParams,
} from '../api/promotions.api';
import type { CreatePromotionData, UpdatePromotionData } from '../types/promotion.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function usePromotions(params: FetchPromotionsParams = {}) {
  return useQuery({
    queryKey: queryKeys.promotions.list(params),
    queryFn: () => fetchPromotions(params),
    staleTime: 3 * 60 * 1000,
  });
}

export function usePromotion(id: number) {
  return useQuery({
    queryKey: queryKeys.promotions.detail(id),
    queryFn: () => fetchPromotionById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePromotionData) => createPromotion(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Promotion created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create promotion');
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePromotionData }) =>
      updatePromotion(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Promotion updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update promotion');
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePromotion(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Promotion deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete promotion');
    },
  });
}

export function useProductSearch(search: string) {
  return useQuery({
    queryKey: queryKeys.promotions.productSearch(search),
    queryFn: () => searchProducts(search),
    enabled: search.length > 0,
    staleTime: 0,
  });
}
