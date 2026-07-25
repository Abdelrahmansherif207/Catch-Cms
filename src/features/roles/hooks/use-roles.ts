import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchRoles,
  fetchRole,
  createRole,
  updateRole,
  deleteRole,
  fetchPermissions,
  assignPermissions,
  fetchUsers,
  fetchUserById,
  assignUserRoles,
  removeUserRoles,
  type FetchRolesParams,
} from '../api/roles.api';
import type { CreateRoleData, UpdateRoleData, RolesListResponse } from '../types/role.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useRoles(params: FetchRolesParams = {}) {
  return useQuery({
    queryKey: queryKeys.roles.list(params),
    queryFn: () => fetchRoles(params),
    staleTime: 10 * 60 * 1000,
  });
}

export function useRole(id: number) {
  return useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: () => fetchRole(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleData) => createRole(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Role created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create role');
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleData }) =>
      updateRole(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Role updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update role');
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.roles.lists() });
      const queries = queryClient.getQueriesData<RolesListResponse>({ queryKey: queryKeys.roles.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));
      queryClient.setQueriesData({ queryKey: queryKeys.roles.lists() }, (old: any) => {
        if (!old?.data || !Array.isArray(old.data)) return old;
        return { ...old, data: old.data.filter((r: { id: number }) => r.id !== id) };
      });
      return { previousData };
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Role deleted successfully');
    },
    onError: (error: unknown, _id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, 'Failed to delete role');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.roles.permissions(),
    queryFn: () => fetchPermissions(200).catch((err) => {
      const apiErr = err as ApiErrorResponse;
      if (apiErr?.status === 403) {
        return { status: 403, message: apiErr.message, success: false, data: [] };
      }
      throw err;
    }),
    staleTime: 15 * 60 * 1000,
    retry: (failureCount, error) => {
      const apiErr = error as unknown as ApiErrorResponse;
      if (apiErr?.status === 403) return false;
      return failureCount < 3;
    },
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) =>
      assignPermissions(roleId, { permissions: permissionIds.map(String) }),
    onSuccess: (response, { roleId }) => {
      toast.success(response.message || 'Permissions assigned successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.detail(roleId) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to assign permissions');
    },
  });
}

export function useUsers(search: string) {
  return useQuery({
    queryKey: queryKeys.users.search(search),
    queryFn: () => fetchUsers(search || undefined, 10),
    staleTime: 30 * 1000,
  });
}

export function useUserWithRoles(id: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => fetchUserById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useAssignUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleIds }: { userId: number; roleIds: number[] }) =>
      assignUserRoles(userId, { role_ids: roleIds.map(String) }),
    onSuccess: (response) => {
      toast.success(response.message || 'Role assigned successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to assign role');
    },
  });
}

export function useRemoveUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleIds }: { userId: number; roleIds: number[] }) =>
      removeUserRoles(userId, { role_ids: roleIds.map(String) }),
    onSuccess: (response) => {
      toast.success(response.message || 'Role removed successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to remove role');
    },
  });
}
