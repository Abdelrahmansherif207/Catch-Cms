import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchSliders,
  fetchSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
  changeSliderStatus,
  reorderSliders,
  searchProducts,
  type FetchSlidersParams,
} from '../api/sliders.api';
import type { CreateSliderData, UpdateSliderData } from '../types/slider.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useSliders(params: FetchSlidersParams = {}, enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.sliders.list(params),
    queryFn: () => fetchSliders(params),
    staleTime: 3 * 60 * 1000,
    enabled,
  });
}

export function useSlider(id: number) {
  return useQuery({
    queryKey: queryKeys.sliders.detail(id),
    queryFn: () => fetchSliderById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateSlider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSliderData) => createSlider(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Slider created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.sliders.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create slider');
    },
  });
}

export function useUpdateSlider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSliderData }) =>
      updateSlider(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Slider updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.sliders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.sliders.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update slider');
    },
  });
}

export function useDeleteSlider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSlider(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Slider deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.sliders.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete slider');
    },
  });
}

export function useChangeSliderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => changeSliderStatus(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sliders.lists() });
      const queries = queryClient.getQueriesData<any>({ queryKey: queryKeys.sliders.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queryClient.setQueriesData({ queryKey: queryKeys.sliders.lists() }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((item: any) =>
              item.id === id ? { ...item, status: !item.status } : item
            ),
          },
        };
      });

      return { previousData };
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Slider status changed');
    },
    onError: (error, _id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, 'Failed to change slider status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sliders.lists() });
    },
  });
}

export function useReorderSliders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sliderIds: number[]) => reorderSliders(sliderIds),
    onMutate: async (sliderIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sliders.lists() });
      const queries = queryClient.getQueriesData<any>({ queryKey: queryKeys.sliders.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queries.forEach(([queryKey, data]) => {
        if (!data?.data?.data) return;
        const itemMap = new Map(data.data.data.map((item: any) => [item.id, item]));
        const reordered = sliderIds
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
      toast.success(response.message || 'Sliders reordered successfully');
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, 'Failed to reorder sliders');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sliders.lists() });
    },
  });
}

export function useProductSearch(search: string) {
  return useQuery({
    queryKey: queryKeys.sliders.productSearch(search),
    queryFn: () => searchProducts(search),
    enabled: search.length > 0,
    staleTime: 0,
  });
}
