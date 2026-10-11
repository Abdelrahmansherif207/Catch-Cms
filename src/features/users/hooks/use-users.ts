import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchUsers,
  fetchRoles,
  fetchUser,
  createUser,
  blockUser,
  unblockUser,
  deleteUser,
  forceDeleteUser,
  restoreUser,
  type FetchUsersParams,
} from '../api/users.api';
import type { CreateUserData, UsersListResponse, ApiActionResponse } from '../types/user.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string) {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useUsers(params: FetchUsersParams = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => fetchUsers(params),
    staleTime: 3 * 60 * 1000,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: fetchRoles,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserData) => createUser(data),
    onSuccess: (response) => {
      toast.success(response.message || 'User created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create user');
    },
  });
}

function useActivationMutation(
  action: (id: number) => Promise<ApiActionResponse>,
  nextActive: boolean,
  fallbackError: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => action(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() });
      const queries = queryClient.getQueriesData<UsersListResponse>({ queryKey: queryKeys.users.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queryClient.setQueriesData<UsersListResponse>({ queryKey: queryKeys.users.lists() }, (old) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((item) =>
              item.id === id ? { ...item, is_active: nextActive } : item
            ),
          },
        };
      });

      return { previousData };
    },
    onSuccess: (response) => {
      toast.success(
        response.message ||
          (nextActive ? 'User activated successfully' : 'User deactivated successfully')
      );
    },
    onError: (error, _id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, fallbackError);
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
}

export function useBlockUser() {
  return useActivationMutation(blockUser, false, 'Failed to deactivate user');
}

export function useUnblockUser() {
  return useActivationMutation(unblockUser, true, 'Failed to activate user');
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: (_response, id) => {
      toast.success(t('users.movedToTrash'), {
        duration: 8000,
        action: {
          label: t('common.undo'),
          onClick: () => {
            restoreUser(id)
              .then((restoreResponse) => {
                toast.success(restoreResponse.message || t('users.restore'));
                queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
              })
              .catch((error) => handleApiError(error, 'Failed to restore user'));
          },
        },
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete user');
    },
  });
}

export function useForceDeleteUser() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => forceDeleteUser(id),
    onSuccess: () => {
      toast.success(t('users.permanentlyDeleted'));
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete user');
    },
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => restoreUser(id),
    onSuccess: (response) => {
      toast.success(response.message || 'User restored successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to restore user');
    },
  });
}
