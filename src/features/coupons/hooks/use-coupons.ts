import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchCoupons,
  fetchCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type FetchCouponsParams,
} from '../api/coupons.api';
import type { CreateCouponData, UpdateCouponData } from '../types/coupon.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useCoupons(params: FetchCouponsParams = {}) {
  return useQuery({
    queryKey: queryKeys.coupons.list(params),
    queryFn: () => fetchCoupons(params),
    staleTime: 3 * 60 * 1000,
  });
}

export function useCoupon(id: number) {
  return useQuery({
    queryKey: queryKeys.coupons.detail(id),
    queryFn: () => fetchCouponById(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCouponData) => createCoupon(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Coupon created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create coupon');
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCouponData }) =>
      updateCoupon(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Coupon updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update coupon');
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCoupon(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Coupon deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete coupon');
    },
  });
}
