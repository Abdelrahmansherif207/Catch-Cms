export { RolesPage } from './pages/roles-page';
export { RoleDetailPage } from './pages/role-detail-page';
export { roleRoutes } from './routes/role.routes';
export {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  usePermissions,
  useAssignPermissions,
} from './hooks/use-roles';
export type {
  Role,
  RoleDetail,
  Permission,
  CreateRoleData,
  UpdateRoleData,
  RolesListResponse,
  RoleDetailResponse,
} from './types/role.types';
export type {
  User,
  UserDetail,
  UserRole,
} from './types/user.types';
