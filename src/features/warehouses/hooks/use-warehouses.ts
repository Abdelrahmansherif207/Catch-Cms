import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchWarehouses,
  fetchWarehouseById,
  fetchWarehouseUsers,
  assignWarehouseUsers,
  removeWarehouseUser,
  createWarehouse,
  updateWarehouse,
  archiveWarehouse,
  activateWarehouse,
  deactivateWarehouse,
  setDefaultWarehouse,
  type FetchWarehousesParams,
} from '../api/warehouses.api';
import type {
  AssignWarehouseUsersData,
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

/**
 * Assigned-staff pivot read — GET /admin/warehouses/{id}/users.
 * Cross-warehouse 404s surface through the page's error state.
 */
export function useWarehouseUsers(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.warehouses.users.of(id),
    queryFn: () => fetchWarehouseUsers(id!),
    enabled: id !== undefined && id !== null,
    staleTime: 30 * 1000,
  });
}

/**
 * Bulk pivot write — POST /admin/warehouses/{id}/users. The error is
 * re-thrown to callers (the dialog maps 422 field errors), after the
 * generic toast.
 */
export function useAssignWarehouseUsers() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: AssignWarehouseUsersData;
    }) => assignWarehouseUsers(id, payload),
    onSuccess: () => {
      toast.success(t('warehouses.usersAssigned'));
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.users.all });
    },
    onError: (error) => {
      handleApiError(error, t('warehouses.assignUsersError'));
    },
  });
}

/**
 * Single-target pivot unlink — DELETE /admin/warehouses/{id}/users/{userId}.
 * Idempotent no-op (200 even when the user was not assigned); 404 on unknown
 * warehouse/user, 403 on foreign-warehouse scope denial. Only the users query
 * is invalidated — assignments don't affect warehouse metadata.
 */
export function useRemoveWarehouseUser() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      id,
      userId,
    }: {
      id: number | string;
      userId: number | string;
    }) => removeWarehouseUser(id, userId),
    onSuccess: () => {
      toast.success(t('warehouses.userRemoved'));
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.users.all });
    },
    onError: (error) => {
      handleApiError(error, t('warehouses.removeUserError'));
    },
  });
}
