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
  type FetchCategoriesParams,
} from '../api/categories.api';
import type { CreateCategoryData, UpdateCategoryData } from '../types/category.types';
import type { ApiErrorResponse } from '@/shared/api';

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
      const queries = queryClient.getQueriesData<any>({ queryKey: queryKeys.categories.all });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queryClient.setQueriesData({ queryKey: queryKeys.categories.all }, (old: any) => {
        if (!old) return old;
        if (old.data?.data && Array.isArray(old.data.data)) {
          return {
            ...old,
            data: {
              ...old.data,
              data: old.data.data.map((item: any) =>
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

