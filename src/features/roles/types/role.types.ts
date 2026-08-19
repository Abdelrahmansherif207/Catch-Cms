export interface Role {
  id: number;
  name?: string;
  display_name: string;
  guard_name?: string;
  created_at?: string;
}

export interface Permission {
  id: number;
  label: string;
}

export interface RoleDetail {
  id: number;
  name?: string;
  display_name: string;
  guard_name?: string;
  created_at?: string;
  permissions: Permission[];
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export type RolesListResponse = ApiResponse<Role[]>;
export type RoleDetailResponse = ApiResponse<RoleDetail>;
export type PermissionsListResponse = ApiResponse<Permission[]>;

export interface CreateRoleData {
  display_name: {
    en: string;
    ar: string;
  };
}

export interface UpdateRoleData {
  display_name: {
    en: string;
    ar: string;
  };
  _method: 'PUT';
}

export interface AssignPermissionsData {
  permissions: string[];
}
