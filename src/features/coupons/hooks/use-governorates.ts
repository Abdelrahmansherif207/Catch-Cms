import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { fetchGovernorates } from '@/features/shipping/api/shipping.api';

export interface GovernorateOption {
  id: number;
  name: string;
}

/**
 * Fetches governorates for the targeting rule-builder area picker.
 * Pass `enabled` to defer the request until the dialog is opened.
 *
 * The backend returns either the wrapped paginator (`data.data`) or a
 * flat array (`data`) depending on response type — normalize both here
 * so consumers always receive a plain options list.
 */
export function useGovernoratesList(enabled: boolean) {
  const query = useQuery({
    queryKey: queryKeys.shipping.governorates.list({ perPage: 1000 }),
    queryFn: () => fetchGovernorates({ perPage: 1000 }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const raw = query.data?.data as
    | Array<{ id: number; name: string }>
    | { data?: Array<{ id: number; name: string }> }
    | undefined;
  const items: GovernorateOption[] = Array.isArray(raw)
    ? raw
    : (raw?.data ?? []).map((g) => ({ id: g.id, name: g.name }));

  return { items, isLoading: query.isLoading };
}
