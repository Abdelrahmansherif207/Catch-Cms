import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import type { EntitlementLimitResponse, EntitlementListFilters } from '../types/digital-entitlement.types';
import {
  fetchEntitlements,
  fetchEntitlement,
  revokeEntitlement,
  restoreEntitlement,
  setEntitlementLimit,
} from '../api/digital-entitlements.api';

/** Paginated entitlement list with the custom {data, meta} envelope. */
export function useEntitlements(filters: EntitlementListFilters) {
  return useQuery({
    queryKey: queryKeys.digitalEntitlements.list(filters),
    queryFn: () => fetchEntitlements(filters),
    staleTime: 30 * 1000,
  });
}

/** Open one ticket (relations user/product are loaded server-side). */
export function useEntitlement(uuid?: string) {
  return useQuery({
    queryKey: queryKeys.digitalEntitlements.detail(uuid ?? ''),
    queryFn: () => fetchEntitlement(uuid as string),
    enabled: !!uuid,
    staleTime: 30 * 1000,
  });
}

function useInvalidateEntitlements() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.digitalEntitlements.all });
}

/** Revokes access; invalidates list + open detail (idempotent server-side). */
export function useRevokeEntitlement() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateEntitlements();

  return useMutation({
    mutationFn: (uuid: string) => revokeEntitlement(uuid),
    onSuccess: (_data, uuid) => {
      void invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.digitalEntitlements.detail(uuid) });
    },
  });
}

/** Restores a revoked ticket; non-revoked replays are 200 no-ops. */
export function useRestoreEntitlement() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateEntitlements();

  return useMutation({
    mutationFn: (uuid: string) => restoreEntitlement(uuid),
    onSuccess: (_data, uuid) => {
      void invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.digitalEntitlements.detail(uuid) });
    },
  });
}

/**
 * Overrides the download cap; `limit: null` sends the absent-key unlimited
 * form (verified server-side). Exposes the previous_limit receipt to the
 * caller for one-click undo.
 */
export function useSetEntitlementLimit(options?: {
  onSuccess?: (response: EntitlementLimitResponse) => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateEntitlements();

  return useMutation({
    mutationFn: ({ uuid, limit }: { uuid: string; limit: number | null }) =>
      setEntitlementLimit(uuid, limit),
    onSuccess: (response: EntitlementLimitResponse) => {
      void invalidate();
      queryClient.invalidateQueries({
        queryKey: queryKeys.digitalEntitlements.detail(response.data.uuid),
      });
      options?.onSuccess?.(response);
    },
    onError: options?.onError,
  });
}
