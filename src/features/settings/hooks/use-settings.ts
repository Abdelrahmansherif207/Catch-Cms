import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import { fetchSettings, updateSettings } from '../api/settings.api';
import type { UpdateSettingsPayload } from '../types/settings.types';
import type { ApiErrorResponse } from '@/shared/api';

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: fetchSettings,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsPayload) => updateSettings(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiErrorResponse;
      toast.error(apiError?.message || 'Failed to update settings');
    },
  });
}
