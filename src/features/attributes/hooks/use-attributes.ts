import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchAttributes,
  fetchAttributeById,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  type FetchAttributesParams,
} from '../api/attributes.api';
import type { CreateAttributePayload, UpdateAttributePayload } from '../api/attributes.api';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useAttributes(params: FetchAttributesParams = {}) {
  return useQuery({
    queryKey: queryKeys.attributes.list(params),
    queryFn: () => fetchAttributes(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttribute(id: number | null) {
  return useQuery({
    queryKey: queryKeys.attributes.detail(id!),
    queryFn: () => fetchAttributeById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAttributePayload) => createAttribute(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Attribute created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create attribute');
    },
  });
}

export function useUpdateAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAttributePayload }) =>
      updateAttribute(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Attribute updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update attribute');
    },
  });
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAttribute(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Attribute deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.attributes.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete attribute');
    },
  });
}
