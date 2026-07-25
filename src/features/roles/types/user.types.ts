export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserRole {
  id: number;
  display_name: string;
}

export interface UserDetail extends User {
  roles: UserRole[];
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  from: number;
  to: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type UsersListResponse = ApiResponse<PaginatedData<User>>;
export type UserDetailResponse = ApiResponse<UserDetail>;

export interface AssignRolePayload {
  role_ids: string[];
}
