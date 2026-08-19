import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchReviews,
  toggleApproveReview,
  deleteReview,
} from '../api/reviews.api';
import type { FetchReviewsParams } from '../types/review.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useReviews(params: FetchReviewsParams) {
  return useQuery({
    queryKey: queryKeys.reviews.list(params),
    queryFn: () => fetchReviews(params),
    enabled: !!params.product_id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useToggleApproveReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => toggleApproveReview(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Review updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update review');
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteReview(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Review deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete review');
    },
  });
}
