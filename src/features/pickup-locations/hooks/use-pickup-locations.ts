import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchPickupLocations,
  fetchPickupLocationById,
  createPickupLocation,
  updatePickupLocation,
  deletePickupLocation,
  type FetchPickupLocationsParams,
} from '../api/pickup-locations.api';
import type { CreatePickupLocationData, UpdatePickupLocationData } from '../types/pickup-location.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function usePickupLocations(params: FetchPickupLocationsParams = {}) {
  return useQuery({
    queryKey: queryKeys.pickupLocations.list(params),
    queryFn: () => fetchPickupLocations(params),
    staleTime: 60 * 1000,
  });
}

export function usePickupLocation(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.pickupLocations.detail(id),
    queryFn: () => fetchPickupLocationById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreatePickupLocation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: CreatePickupLocationData) => createPickupLocation(payload),
    onSuccess: () => {
      toast.success(t('pickupLocations.created'));
      queryClient.invalidateQueries({ queryKey: queryKeys.pickupLocations.lists() });
    },
    onError: (error) => {
      handleApiError(error, t('pickupLocations.createError'));
    },
  });
}

export function useUpdatePickupLocation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePickupLocationData }) =>
      updatePickupLocation(id, payload),
    onSuccess: () => {
      toast.success(t('pickupLocations.updated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.pickupLocations.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.pickupLocations.details() });
    },
    onError: (error) => {
      handleApiError(error, t('pickupLocations.updateError'));
    },
  });
}

export function useSetDefaultPickupLocation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => updatePickupLocation(id, { is_default: true }),
    onSuccess: () => {
      toast.success(t('pickupLocations.defaultUpdated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.pickupLocations.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.pickupLocations.details() });
    },
    onError: (error) => {
      handleApiError(error, t('pickupLocations.updateError'));
    },
  });
}

export function useDeletePickupLocation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => deletePickupLocation(id),
    onSuccess: () => {
      toast.success(t('pickupLocations.deleted'));
      queryClient.invalidateQueries({ queryKey: queryKeys.pickupLocations.lists() });
    },
    onError: (error) => {
      handleApiError(error, t('pickupLocations.deleteError'));
    },
  });
}
