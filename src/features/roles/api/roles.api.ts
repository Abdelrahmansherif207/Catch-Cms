import { axiosClient } from '@/shared/api';
import type {
  RolesListResponse,
  RoleDetailResponse,
  PermissionsListResponse,
  ApiResponse,
  CreateRoleData,
  UpdateRoleData,
  AssignPermissionsData,
  RoleDetail,
} from '../types/role.types';
import type {
  UsersListResponse,
  UserDetailResponse,
  AssignRolePayload,
  UserDetail,
} from '../types/user.types';
import type { Permission } from '../types/role.types';

export interface FetchRolesParams {
  limit?: number;
  search?: string;
}

export async function fetchRoles({ limit, search }: FetchRolesParams = {}): Promise<RolesListResponse> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (search) params.append('search', search);
  const query = params.toString();
  const { data } = await axiosClient.get<RolesListResponse>(`/roles${query ? '?' + query : ''}`);
  return data;
}

export async function fetchRole(id: number): Promise<RoleDetailResponse> {
  const { data } = await axiosClient.get<RoleDetailResponse>(`/roles/${id}?with=permissions`);
  return data;
}

export async function createRole(payload: CreateRoleData): Promise<ApiResponse<RoleDetail>> {
  const { data } = await axiosClient.post<ApiResponse<RoleDetail>>('/roles', payload);
  return data;
}

export async function updateRole(id: number, payload: UpdateRoleData): Promise<ApiResponse<RoleDetail>> {
  const { data } = await axiosClient.post<ApiResponse<RoleDetail>>(`/roles/${id}`, payload);
  return data;
}

export async function deleteRole(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>(`/roles/${id}`);
  return data;
}

export async function fetchPermissions(limit = 200): Promise<PermissionsListResponse> {
  const { data } = await axiosClient.get<PermissionsListResponse>(`/permissions?limit=${limit}`);
  return data;
}

export async function fetchPermissionsWithRoles(limit = 200): Promise<{ permissions: Permission[] }> {
  const { data } = await axiosClient.get<PermissionsListResponse>(`/permissions?limit=${limit}`);
  return { permissions: data.data };
}

export async function assignPermissions(roleId: number, payload: AssignPermissionsData): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.post<ApiResponse<null>>(`/roles/${roleId}/permissions`, payload);
  return data;
}

export async function fetchUsers(search?: string, limit = 10): Promise<UsersListResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('limit', limit.toString());
  const { data } = await axiosClient.get<UsersListResponse>(`/users?admins=true&${params.toString()}`);
  return data;
}

export async function fetchUserById(id: number): Promise<UserDetailResponse> {
  const { data } = await axiosClient.get<UserDetailResponse>(`/users/${id}`);
  return data;
}

export async function assignUserRoles(userId: number, payload: AssignRolePayload): Promise<ApiResponse<UserDetail>> {
  const { data } = await axiosClient.post<ApiResponse<UserDetail>>(`/users/${userId}/assign-role`, payload);
  return data;
}

export async function removeUserRoles(userId: number, payload: AssignRolePayload): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.post<ApiResponse<null>>(`/users/${userId}/remove-role`, payload);
  return data;
}
