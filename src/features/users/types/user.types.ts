export interface UserPermission {
  id: number;
  label: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_active: number | boolean;
  image: string | null;
  phone_number: string;
  type: string;
  permissions: UserPermission[];
}

export interface UserDetail extends User {
  roles: UserRole[];
}

export interface Role {
  id: number;
  display_name: string;
}

export interface RolePermission {
  id: number;
  label: string;
}

export interface UserRole {
  id: number;
  display_name: string;
  permissions: RolePermission[];
}

export interface CreateUserResponseData {
  id: number;
  name: string;
  email: string;
  email_verified_at: string;
  is_active: boolean;
  image: string | null;
  roles: UserRole[];
  permissions: UserPermission[];
}

export interface UsersListOriginal {
  data: User[];
  page: number;
  current_page: number;
  from: number;
  to: number;
  last_page: number;
  path: string;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  last_page_url: string;
  first_page_url: string;
}

export interface UsersListResponse {
  status: number;
  message: string;
  success: boolean;
  data: UsersListOriginal;
}

export interface UserDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: UserDetail;
}

export interface CreateUserResponse {
  status: number;
  message: string;
  success: boolean;
  data: CreateUserResponseData;
}

export interface ApiActionResponse {
  status: number;
  message: string;
  success: boolean;
}

export interface RolesResponse {
  status: number;
  message: string;
  success: boolean;
  data: Role[];
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone_number: string;
  roles: number[];
  is_active: 0 | 1;
  image?: File;
}
