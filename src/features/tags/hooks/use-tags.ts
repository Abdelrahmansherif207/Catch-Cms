import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchTags,
  fetchTagById,
  createTag,
  updateTag,
  deleteTag,
  type FetchTagsParams,
} from '../api/tags.api';
import type { CreateTagData, UpdateTagData } from '../types/tag.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  toast.error(apiError?.message || fallbackMessage);
  return apiError;
}

export function useTags(params: FetchTagsParams = {}) {
  return useQuery({
    queryKey: queryKeys.tags.list(params),
    queryFn: () => fetchTags(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTag(id: number) {
  return useQuery({
    queryKey: queryKeys.tags.detail(id),
    queryFn: () => fetchTagById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagData) => createTag(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Tag created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create tag');
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTagData }) => updateTag(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Tag updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update tag');
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Tag deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete tag');
    },
  });
}
