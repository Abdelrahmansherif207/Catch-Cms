import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';

/** Flow changes affect the public checkout schema + order statuses. */
export function invalidateOrders(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}
