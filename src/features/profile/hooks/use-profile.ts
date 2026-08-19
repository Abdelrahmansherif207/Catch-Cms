import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { fetchProfile } from '../api/profile.api';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: fetchProfile,
    staleTime: 10 * 60 * 1000,
  });
}
