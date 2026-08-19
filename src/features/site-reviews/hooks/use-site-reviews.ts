import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchSiteReviews,
  fetchSiteReviewById,
  approveSiteReview,
  rejectSiteReview,
  type FetchSiteReviewsParams,
} from '../api/site-reviews.api';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useSiteReviews(params: FetchSiteReviewsParams = {}) {
  return useQuery({
    queryKey: queryKeys.siteReviews.list(params),
    queryFn: () => fetchSiteReviews(params),
    staleTime: 60 * 1000,
  });
}

export function useSiteReview(id: number | null) {
  return useQuery({
    queryKey: queryKeys.siteReviews.detail(id!),
    queryFn: () => fetchSiteReviewById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

function useModerateMutation(action: 'approve' | 'reject') {
  const queryClient = useQueryClient();

  const mutationFn = action === 'approve' ? approveSiteReview : rejectSiteReview;
  const key = action === 'approve' ? 'Approved' : 'Rejected';

  return useMutation({
    mutationFn: (id: number) => mutationFn(id),
    onSuccess: (response) => {
      toast.success(response.message || `Review ${key} successfully`);
      queryClient.invalidateQueries({ queryKey: queryKeys.siteReviews.all });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiErrorResponse;
      if (apiError?.status === 404) {
        queryClient.invalidateQueries({ queryKey: queryKeys.siteReviews.all });
        return;
      }
      handleApiError(error, `Failed to ${action} review`);
    },
  });
}

export function useApproveSiteReview() {
  return useModerateMutation('approve');
}

export function useRejectSiteReview() {
  return useModerateMutation('reject');
}