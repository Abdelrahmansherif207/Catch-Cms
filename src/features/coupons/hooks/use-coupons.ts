import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchCoupons,
  fetchCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  fetchAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  validateCouponConfiguration,
  fetchCouponUsageInfo,
  suggestCouponFix,
  fetchCouponTargeting,
  upsertCouponTargeting,
  deleteCouponTargeting,
  type FetchCouponsParams,
  type FetchAssignmentsParams,
} from '../api/coupons.api';
import type {
  CreateCouponData,
  UpdateCouponData,
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
  ValidateConfigurationPayload,
  SuggestFixPayload,
  UpsertTargetingPayload,
} from '../types/coupon.types';
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

export function useAssignments(couponId: number, params: FetchAssignmentsParams = {}) {
  return useQuery({
    queryKey: queryKeys.coupons.assignments.list(couponId, params),
    queryFn: () => fetchAssignments(couponId, params),
    enabled: !!couponId,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateAssignment(couponId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssignmentPayload) => createAssignment(couponId, data),
    onSuccess: (response) => {
      toast.success(response.message || 'User assigned successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.assignments.all(couponId) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to assign user');
    },
  });
}

export function useUpdateAssignment(couponId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssignmentPayload }) =>
      updateAssignment(couponId, id, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Assignment updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.assignments.all(couponId) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update assignment');
    },
  });
}

export function useDeleteAssignment(couponId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAssignment(couponId, id),
    onSuccess: (response) => {
      toast.success(response.message || 'Assignment removed successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.assignments.all(couponId) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to remove assignment');
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

/**
 * Coupon Helper: usage-info dashboard (point-in-time, read-only).
 * Short staleTime because usage numbers move on every redemption.
 */
export function useCouponUsageInfo(couponId: number) {
  return useQuery({
    queryKey: queryKeys.coupons.usageInfo(couponId),
    queryFn: () => fetchCouponUsageInfo(couponId),
    enabled: !!couponId,
    staleTime: 30 * 1000,
  });
}

/**
 * Coupon Helper: pre-save capacity-model sanity check.
 * Note: the API returns HTTP 200 even when `valid: false`, so callers must
 * branch on `response.data.valid` inside onSuccess — not onError.
 */
export function useValidateConfiguration() {
  return useMutation({
    mutationFn: (payload: ValidateConfigurationPayload) => validateCouponConfiguration(payload),
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to validate configuration');
    },
  });
}

/**
 * Coupon Helper: single<->multi-use diagnostic advisor (read-only).
 * 400 responses (invalid desired_behavior) surface through onError.
 */
export function useSuggestFix(couponId: number) {
  return useMutation({
    mutationFn: (payload: SuggestFixPayload) => suggestCouponFix(couponId, payload),
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to get suggestion');
    },
  });
}

export function useCouponTargeting(couponId: number) {
  return useQuery({
    queryKey: queryKeys.coupons.targeting.detail(couponId),
    queryFn: () => fetchCouponTargeting(couponId),
    enabled: !!couponId,
    staleTime: 3 * 60 * 1000,
  });
}

export function useUpsertTargeting(couponId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpsertTargetingPayload) => upsertCouponTargeting(couponId, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Targeting saved successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.targeting.all(couponId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.detail(couponId) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to save targeting');
    },
  });
}

export function useDeleteTargeting(couponId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteCouponTargeting(couponId),
    onSuccess: (response) => {
      toast.success(response.message || 'Targeting removed successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.targeting.all(couponId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.detail(couponId) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to remove targeting');
    },
  });
}
