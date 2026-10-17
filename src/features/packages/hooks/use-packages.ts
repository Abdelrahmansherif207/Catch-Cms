import { useMemo } from 'react';
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
  PackageListItem,
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

export function usePackages(params: FetchPackagesParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.packages.list(params),
    queryFn: () => fetchPackages(params),
    enabled,
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

/**
 * Per-fulfillment-item packaging coverage — mirrors the verify engine rule
 * (SUM of non-voided package_items.quantity per fulfillment_item; "picked N,
 * packed M" refusals). The packages INDEX rows carry NO items, so every
 * non-voided package detail is fetched and summed into a plain Record keyed
 * by fulfillment_item_id. Keyed under packages.details() so every package
 * mutation's packages.all invalidation refetches it automatically.
 * A coverage QUERY error deliberately does NOT block the caller — the
 * engine stays the authority (soft-degrade: guard reads as "ready").
 */
export function usePackageItemTotals(
  packages: PackageListItem[] | undefined,
  enabled = true
) {
  const activeIds = useMemo(
    () =>
      (packages ?? [])
        .filter((pkg) => pkg.status !== 'voided')
        .map((pkg) => pkg.id),
    [packages]
  );
  const activeKey = activeIds.join(',');
  return useQuery<Record<string, number>>({
    queryKey: [...queryKeys.packages.details(), 'coverage', activeKey] as const,
    queryFn: async () => {
      const details = await Promise.all(activeIds.map((id) => fetchPackageById(id)));
      const totals: Record<string, number> = {};
      for (const response of details) {
        for (const entry of response.data.items) {
          const itemId = entry.fulfillment_item_id;
          totals[itemId] = (totals[itemId] ?? 0) + (Number(entry.quantity) || 0);
        }
      }
      return totals;
    },
    enabled: enabled && packages !== undefined,
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
