import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchPackingStations,
  fetchPackingStationById,
  createPackingStation,
  updatePackingStation,
  deletePackingStation,
  type FetchPackingStationsParams,
} from '../api/packing-stations.api';
import type {
  CreatePackingStationData,
  UpdatePackingStationData,
} from '../types/packing-station.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.packingStations.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.packingStations.details() });
}

export function usePackingStations(params: FetchPackingStationsParams = {}) {
  return useQuery({
    queryKey: queryKeys.packingStations.list(params),
    queryFn: () => fetchPackingStations(params),
    staleTime: 60 * 1000,
  });
}

export function usePackingStation(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.packingStations.detail(id),
    queryFn: () => fetchPackingStationById(Number(id!)),
    enabled: id !== undefined && id !== null,
    staleTime: 60 * 1000,
  });
}

export function useCreatePackingStation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: CreatePackingStationData) => createPackingStation(payload),
    onSuccess: () => {
      toast.success(t('packingStations.created'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('packingStations.createError'));
    },
  });
}

export function useUpdatePackingStation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePackingStationData }) =>
      updatePackingStation(id, payload),
    onSuccess: () => {
      toast.success(t('packingStations.updated'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('packingStations.updateError'));
    },
  });
}

export function useDeletePackingStation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => deletePackingStation(id),
    onSuccess: () => {
      toast.success(t('packingStations.deleted'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      // The busy-station 422 carries a live literal message with NO errors map —
      // the backend message ("Cannot delete packing station: active packing
      // tasks exist.") is shown as-is through the generic toast path.
      handleApiError(error, t('packingStations.deleteError'));
    },
  });
}
