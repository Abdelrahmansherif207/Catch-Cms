import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchSections,
  fetchSectionById,
  createSection,
  updateSection,
  deleteSection,
  toggleSectionActive,
  reorderSections,
  fetchSectionTypes,
  fetchTypeSettings,
  fetchProductTypes,
  searchEntities,
} from '../api/sections.api';
import type { CreateSectionPayload, UpdateSectionPayload, SectionsListResponse } from '../types/section.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

// ─── Queries ─────────────────────────────────────────────────────

export function useSections() {
  return useQuery({
    queryKey: queryKeys.sections.all,
    queryFn: fetchSections,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSection(id: number) {
  return useQuery({
    queryKey: queryKeys.sections.detail(id),
    queryFn: () => fetchSectionById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSectionTypes() {
  return useQuery({
    queryKey: queryKeys.sections.sectionTypes(),
    queryFn: fetchSectionTypes,
    staleTime: 15 * 60 * 1000,
  });
}

export function useTypeSettings(typeName: string) {
  return useQuery({
    queryKey: queryKeys.sections.typeSettings(typeName),
    queryFn: () => fetchTypeSettings(typeName),
    enabled: !!typeName,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductTypes() {
  return useQuery({
    queryKey: queryKeys.sections.productTypes(),
    queryFn: fetchProductTypes,
    staleTime: 15 * 60 * 1000,
  });
}

export function useEntitySearch(endpoint: string, search: string) {
  return useQuery({
    queryKey: queryKeys.sections.entitySearch(endpoint, search),
    queryFn: () => searchEntities(endpoint, search),
    enabled: !!endpoint,
    staleTime: 0,
  });
}

// ─── Mutations ───────────────────────────────────────────────────

export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSectionPayload) => createSection(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Section created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create section');
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSectionPayload }) =>
      updateSection(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Section updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update section');
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSection(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Section deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete section');
    },
  });
}

export function useToggleSectionActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => toggleSectionActive(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sections.lists() });
      const queries = queryClient.getQueriesData<any>({ queryKey: queryKeys.sections.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queryClient.setQueriesData({ queryKey: queryKeys.sections.lists() }, (old: unknown) => {
        const sectionsData = old as SectionsListResponse | undefined;
        if (!sectionsData?.data) return old;
        return {
          ...sectionsData,
          data: sectionsData.data.map((item) =>
            item.id === id ? { ...item, is_active: !item.is_active } : item
          ),
        };
      });

      return { previousData };
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Section status updated');
    },
    onError: (error, _id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, 'Failed to toggle section status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.lists() });
    },
  });
}

export function useReorderSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionIds: number[]) => reorderSections(sectionIds),
    onMutate: async (sectionIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sections.lists() });
      const queries = queryClient.getQueriesData<any>({ queryKey: queryKeys.sections.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queries.forEach(([queryKey, data]) => {
        const sectionsData = data as SectionsListResponse | undefined;
        if (!sectionsData?.data) return;
        const itemMap = new Map(sectionsData.data.map((item) => [item.id, item]));
        const reordered = sectionIds
          .map((id) => itemMap.get(id))
          .filter(Boolean);

        if (reordered.length === sectionsData.data.length) {
          queryClient.setQueryData(queryKey, {
            ...sectionsData,
            data: reordered,
          });
        }
      });

      return { previousData };
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Sections reordered successfully');
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, 'Failed to reorder sections');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.lists() });
    },
  });
}
