import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchPackages,
  fetchPackageById,
  createPackage,
  addPackageItem,
  sealPackage,
  voidPackage,
} from '../api/packages.api';
import type {
  AddPackageItemData,
  CreatePackageData,
  FetchPackagesParams,
  VoidPackageData,
} from '../types/package.types';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

/**
 * Package commands mirror onto the fulfillment payload (packages rows +
 * the verify math read them) — invalidate fulfillments together.
 */
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.packages.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.fulfillments.all });
}

export function usePackages(params: FetchPackagesParams) {
  return useQuery({
    queryKey: queryKeys.packages.list(params),
    queryFn: () => fetchPackages(params),
    staleTime: 15 * 1000,
  });
}

export function usePackage(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.packages.detail(id),
    queryFn: () => fetchPackageById(Number(id!)),
    enabled: id !== undefined && id !== null,
    staleTime: 15 * 1000,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: CreatePackageData) => createPackage(payload),
    onSuccess: () => {
      toast.success(t('packages.created'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      // 409 one-active-package conflict text surfaces verbatim.
      handleApiError(error, t('packages.createError'));
    },
  });
}

export function useAddPackageItem(onDone?: () => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AddPackageItemData }) =>
      addPackageItem(id, payload),
    onSuccess: () => {
      toast.success(t('packages.itemAdded'));
      invalidateAll(queryClient);
      onDone?.();
    },
    onError: (error) => {
      // Over-pack / unpicked / foreign-item 422s are the operator's checklist.
      handleApiError(error, t('packages.itemError'));
    },
  });
}

export function useSealPackage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id }: { id: number }) => sealPackage(id),
    onSuccess: () => {
      toast.success(t('packages.sealed'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('packages.sealError'));
    },
  });
}

export function useVoidPackage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: VoidPackageData }) =>
      voidPackage(id, payload),
    onSuccess: () => {
      toast.success(t('packages.voided'));
      invalidateAll(queryClient);
    },
    onError: (error) => {
      handleApiError(error, t('packages.voidError'));
    },
  });
}
