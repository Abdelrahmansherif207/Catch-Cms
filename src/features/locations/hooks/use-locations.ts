import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchLocations,
  fetchLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  activateLocation,
  deactivateLocation,
  type FetchLocationsParams,
} from '../api/locations.api';
import type {
  CreateLocationData,
  UpdateLocationData,
} from '../types/location.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.locations.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.locations.details() });
}

export function useLocations(params: FetchLocationsParams = {}) {
  return useQuery({
    queryKey: queryKeys.locations.list(params),
    queryFn: () => fetchLocations(params),
    staleTime: 60 * 1000,
  });
}

export function useLocationById(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.locations.detail(id),
    queryFn: () => fetchLocationById(id!),
    enabled: id !== undefined && id !== null,
    staleTime: 60 * 1000,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: CreateLocationData) => createLocation(payload),
    onSuccess: () => {
      toast.success(t('locations.created'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('locations.createError'));
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateLocationData }) =>
      updateLocation(id, payload),
    onSuccess: () => {
      toast.success(t('locations.updated'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('locations.updateError'));
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number | string) => deleteLocation(id),
    onSuccess: () => {
      toast.success(t('locations.deleted'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('locations.deleteError'));
    },
  });
}

export function useActivateLocation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number | string) => activateLocation(id),
    onSuccess: () => {
      toast.success(t('locations.activated'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('locations.activateError'));
    },
  });
}

export function useDeactivateLocation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number | string) => deactivateLocation(id),
    onSuccess: () => {
      toast.success(t('locations.deactivated'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('locations.deactivateError'));
    },
  });
}
