import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchActivityLogs,
  type FetchActivityLogsParams,
} from '../api/activity-logs.api';

export function useActivityLogs(params: FetchActivityLogsParams = {}) {
  return useQuery({
    queryKey: queryKeys.activityLogs.list(params),
    queryFn: () => fetchActivityLogs(params),
    staleTime: 60 * 1000,
  });
}
