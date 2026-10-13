import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { createDigitalAsset, deleteDigitalAsset, fetchDigitalAssets, replaceDigitalAsset, addDigitalLicenseKeys } from '../api/digital-assets.api';
import {
  type CreateDigitalAssetPayload,
  type DigitalAssetResponse,
  type LicenseKeyResultResponse,
} from '../types/digital-asset.types';

/** Assets attached to a product. Enabled only when a product id exists (edit/live mode). */
export function useDigitalAssets(productId?: number) {
  return useQuery({
    queryKey: queryKeys.products.digitalAssets.list(productId ?? 0),
    queryFn: () => fetchDigitalAssets(productId as number),
    enabled: !!productId,
    staleTime: 1 * 60 * 1000,
  });
}

/** Attach one asset to a DIGITAL product. */
export function useCreateDigitalAsset(
  productId?: number,
  options?: {
    onSuccess?: (_data: DigitalAssetResponse['data']) => void;
    onError?: (_error: unknown) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDigitalAssetPayload) => createDigitalAsset(productId as number, payload),
    onSuccess: (response) => {
      if (productId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.products.digitalAssets.list(productId),
        });
      }
      options?.onSuccess?.(response.data);
    },
    onError: options?.onError,
  });
}

/** Replace the bytes of a FILE asset while keeping its uuid identity. */
export function useReplaceDigitalAsset(
  productId?: number,
  options?: {
    onSuccess?: (_data: DigitalAssetResponse['data']) => void;
    onError?: (_error: unknown) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, file }: { uuid: string; file: File }) => replaceDigitalAsset(uuid, file),
    onSuccess: (response) => {
      if (productId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.products.digitalAssets.list(productId),
        });
      }
      options?.onSuccess?.(response.data);
    },
    onError: options?.onError,
  });
}

/** Provision license keys into a LICENSE pool. */
export function useAddLicenseKeys(
  productId?: number,
  options?: {
    onSuccess?: (_result: { created: number; skipped_blank: number; skipped_duplicate: number }) => void;
    onError?: (_error: unknown) => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, keys }: { uuid: string; keys: string[] }) => addDigitalLicenseKeys(uuid, keys),
    onSuccess: (response: LicenseKeyResultResponse) => {
      if (productId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.products.digitalAssets.list(productId),
        });
      }
      options?.onSuccess?.(response.data);
    },
    onError: options?.onError,
  });
}

/**
 * Remove an asset. Invalidation runs on settle (success OR error) because
 * non-FILE deletes currently answer HTTP 500 while still removing the row
 * server-side — the refetch is the only reliable source of truth.
 */
export function useDeleteDigitalAsset(productId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deleteDigitalAsset(uuid),
    onSettled: () => {
      if (productId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.products.digitalAssets.list(productId),
        });
      }
    },
  });
}
