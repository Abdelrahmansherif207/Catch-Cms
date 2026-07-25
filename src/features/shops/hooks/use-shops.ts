import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { fetchShops, type FetchShopsParams } from '../api/shops.api';

export function useShops(params: FetchShopsParams = {}) {
  return useQuery({
    queryKey: queryKeys.shops.list(params),
    queryFn: () => fetchShops(params),
    staleTime: 5 * 60 * 1000,
  });
}
