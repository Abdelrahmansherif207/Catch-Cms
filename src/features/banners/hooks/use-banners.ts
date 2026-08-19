import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchBanners,
  fetchBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  searchProducts,
  type FetchBannersParams,
} from '../api/banners.api';
import type { CreateBannerData, UpdateBannerData } from '../types/banner.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useBanners(params: FetchBannersParams = {}) {
  return useQuery({
    queryKey: queryKeys.banners.list(params),
    queryFn: () => fetchBanners(params),
    staleTime: 3 * 60 * 1000,
  });
}

export function useBanner(id: number) {
  return useQuery({
    queryKey: queryKeys.banners.detail(id),
    queryFn: () => fetchBannerById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBannerData) => createBanner(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Banner created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create banner');
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBannerData }) =>
      updateBanner(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Banner updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update banner');
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Banner deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete banner');
    },
  });
}

export function useProductSearch(search: string, enabled = false) {
  return useQuery({
    queryKey: queryKeys.banners.productSearch(search),
    queryFn: () => searchProducts(search),
    enabled: enabled || search.length > 0,
    staleTime: 0,
  });
}
