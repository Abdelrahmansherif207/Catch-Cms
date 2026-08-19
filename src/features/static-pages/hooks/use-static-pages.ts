import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchStaticPages,
  fetchStaticPageBySlug,
  fetchStaticPagePreview,
  updateStaticPage,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from '../api/static-pages.api';
import type {
  StaticPageDetailResponse,
  StaticPageSection,
  StaticPageUpdatePayload,
  CreateSectionPayload,
  UpdateSectionPayload,
} from '../types/static-page.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

// ─── Queries ─────────────────────────────────────────────────────

export function useStaticPages() {
  return useQuery({
    queryKey: queryKeys.staticPages.list(),
    queryFn: fetchStaticPages,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStaticPage(slug: string) {
  return useQuery({
    queryKey: queryKeys.staticPages.detail(slug),
    queryFn: () => fetchStaticPageBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// Public preview — lang-scoped key so the page re-fetches on locale change (Task 5).
export function useStaticPagePreview(slug: string, lang: string) {
  return useQuery({
    queryKey: queryKeys.staticPages.preview(slug, lang),
    queryFn: () => fetchStaticPagePreview(slug),
    enabled: !!slug,
    staleTime: 0,
    retry: (failureCount, error) => {
      const apiError = error as unknown as ApiErrorResponse;
      if (apiError?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

// ─── Mutations — page (Task 2) ───────────────────────────────────

export function useUpdateStaticPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: StaticPageUpdatePayload }) =>
      updateStaticPage(slug, data),
    onSuccess: (response, { slug }) => {
      toast.success(response.message || 'Page updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.staticPages.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.staticPages.detail(slug) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update page');
    },
  });
}

// ─── Mutations — sections (Task 3) ───────────────────────────────

export function useCreateStaticPageSection(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSectionPayload) => createSection(slug, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Section created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.staticPages.detail(slug) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create section');
    },
  });
}

export function useUpdateStaticPageSection(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSectionPayload }) =>
      updateSection(slug, id, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Section updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.staticPages.detail(slug) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update section');
    },
  });
}

export function useDeleteStaticPageSection(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSection(slug, id),
    onSuccess: (response) => {
      toast.success(response.message || 'Section deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.staticPages.detail(slug) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete section');
    },
  });
}

export function useReorderStaticPageSections(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionIds: number[]) => reorderSections(slug, sectionIds),
    onMutate: async (sectionIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.staticPages.detail(slug) });
      const queries = queryClient.getQueriesData<StaticPageDetailResponse>({
        queryKey: queryKeys.staticPages.detail(slug),
      });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queries.forEach(([queryKey, data]) => {
        if (!data?.data?.sections) return;
        const itemMap = new Map(data.data.sections.map((item) => [item.id, item]));
        const reordered = sectionIds
          .map((id) => itemMap.get(id))
          .filter((item): item is StaticPageSection => !!item);

        if (reordered.length === data.data.sections.length) {
          queryClient.setQueryData(queryKey, {
            ...data,
            data: { ...data.data, sections: reordered },
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
      queryClient.invalidateQueries({ queryKey: queryKeys.staticPages.detail(slug) });
    },
  });
}