import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchFaqs,
  fetchFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  type FetchFaqsParams,
} from '../api/faqs.api';
import type { CreateFaqData, UpdateFaqData } from '../types/faq.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useFaqs(params: FetchFaqsParams = {}) {
  return useQuery({
    queryKey: queryKeys.faqs.list(params),
    queryFn: () => fetchFaqs(params),
    staleTime: 3 * 60 * 1000,
  });
}

export function useFaq(id: number) {
  return useQuery({
    queryKey: queryKeys.faqs.detail(id),
    queryFn: () => fetchFaqById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFaqData) => createFaq(data),
    onSuccess: (response) => {
      toast.success(response.message || 'FAQ created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create FAQ');
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFaqData }) =>
      updateFaq(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'FAQ updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update FAQ');
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteFaq(id),
    onSuccess: (response) => {
      toast.success(response.message || 'FAQ deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete FAQ');
    },
  });
}

export function useReorderFaqs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (faqIds: number[]) => reorderFaqs(faqIds),
    onMutate: async (faqIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.faqs.lists() });
      const queries = queryClient.getQueriesData<any>({ queryKey: queryKeys.faqs.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queries.forEach(([queryKey, data]) => {
        if (!data?.data?.data) return;
        const itemMap = new Map(data.data.data.map((item: any) => [item.id, item]));
        const reordered = faqIds
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
      toast.success(response.message || 'FAQs reordered successfully');
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, 'Failed to reorder FAQs');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
    },
  });
}
