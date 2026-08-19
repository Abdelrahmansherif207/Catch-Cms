import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchUsers,
  fetchRoles,
  fetchUser,
  createUser,
  toggleActivation,
  deleteUser,
  forceDeleteUser,
  restoreUser,
  type FetchUsersParams,
} from '../api/users.api';
import type { CreateUserData } from '../types/user.types';
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

export function useToggleActivation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => toggleActivation(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() });
      const queries = queryClient.getQueriesData<any>({ queryKey: queryKeys.users.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queryClient.setQueriesData({ queryKey: queryKeys.users.lists() }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((item: any) =>
              item.id === userId ? { ...item, is_active: !item.is_active } : item
            ),
          },
        };
      });

      return { previousData };
    },
    onSuccess: (response) => {
      toast.success(response.message || 'User updated successfully');
    },
    onError: (error, _userId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, 'Failed to update user');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: (response) => {
      toast.success(response.message || 'User deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete user');
    },
  });
}

export function useForceDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => forceDeleteUser(id),
    onSuccess: (response) => {
      toast.success(response.message || 'User deleted permanently');
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
