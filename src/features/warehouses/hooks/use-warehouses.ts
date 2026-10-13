import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchWarehouses,
  fetchWarehouseById,
  createWarehouse,
  updateWarehouse,
  archiveWarehouse,
  activateWarehouse,
  deactivateWarehouse,
  setDefaultWarehouse,
  type FetchWarehousesParams,
} from '../api/warehouses.api';
import type {
  CreateWarehouseData,
  UpdateWarehouseData,
} from '../types/warehouse.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.details() });
}

export function useWarehouses(params: FetchWarehousesParams = {}) {
  return useQuery({
    queryKey: queryKeys.warehouses.list(params),
    queryFn: () => fetchWarehouses(params),
    staleTime: 60 * 1000,
  });
}

export function useWarehouse(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.warehouses.detail(id),
    queryFn: () => fetchWarehouseById(id!),
    enabled: id !== undefined && id !== null,
    staleTime: 60 * 1000,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: CreateWarehouseData) => createWarehouse(payload),
    onSuccess: () => {
      toast.success(t('warehouses.created'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('warehouses.createError'));
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateWarehouseData }) =>
      updateWarehouse(id, payload),
    onSuccess: () => {
      toast.success(t('warehouses.updated'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('warehouses.updateError'));
    },
  });
}

export function useActivateWarehouse() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number | string) => activateWarehouse(id),
    onSuccess: () => {
      toast.success(t('warehouses.activated'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('warehouses.activateError'));
    },
  });
}

export function useDeactivateWarehouse() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number | string) => deactivateWarehouse(id),
    onSuccess: () => {
      toast.success(t('warehouses.deactivated'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('warehouses.deactivateError'));
    },
  });
}

export function useSetDefaultWarehouse() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number | string) => setDefaultWarehouse(id),
    onSuccess: () => {
      toast.success(t('warehouses.defaultUpdated'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('warehouses.defaultUpdateError'));
    },
  });
}

export function useArchiveWarehouse() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number | string) => archiveWarehouse(id),
    onSuccess: () => {
      // Backend literal: "Warehouse archived successfully." — keep the
      // archived wording (soft delete, NO restore endpoint).
      toast.success(t('warehouses.archived'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('warehouses.archiveError'));
    },
  });
}
