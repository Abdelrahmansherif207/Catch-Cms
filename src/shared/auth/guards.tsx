import { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { Permission } from './permissions';

export interface PermissionsApi {
  /** Exact single-permission check (super_admin bypasses everything). */
  can: (permission: Permission) => boolean;
  /** At least one of the given permissions is held. */
  canAny: (permissions: readonly Permission[]) => boolean;
  /** Every given permission is held. */
  canAll: (permissions: readonly Permission[]) => boolean;
  isSuperAdmin: boolean;
}

/**
 * O(1) permission checks backed by a memoized Set of the user's grants.
 * Use this everywhere instead of reading the auth store directly.
 */
export function usePermissions(): PermissionsApi {
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    const granted = new Set<string>(user?.permissions ?? []);
    const bypass = Boolean(user?.role?.includes('super_admin'));

    const can = (permission: Permission) => bypass || granted.has(permission);
    const canAny = (permissions: readonly Permission[]) =>
      permissions.some((permission) => can(permission));
    const canAll = (permissions: readonly Permission[]) =>
      permissions.every((permission) => can(permission));

    return { can, canAny, canAll, isSuperAdmin: bypass };
  }, [user]);
}

interface CanProps {
  /** Render children only if this permission is held. */
  permission?: Permission;
  /** Render children only if at least one of these permissions is held. */
  anyOf?: readonly Permission[];
  /** Render children only if all of these permissions are held. */
  allOf?: readonly Permission[];
  /** Optional UI shown instead when access is denied. Defaults to nothing. */
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Declarative conditional rendering:
 *
 *   <Can permission={PERMISSIONS.categories.import}>
 *     <ImportButton />
 *   </Can>
 */
export function Can({ permission, anyOf, allOf, fallback = null, children }: CanProps) {
  const { can, canAny, canAll } = usePermissions();

  const hasSingle = permission ? can(permission) : true;
  const hasAny = anyOf ? canAny(anyOf) : true;
  const hasAll = allOf && allOf.length > 0 ? canAll(allOf) : true;
  const configured = Boolean(permission || anyOf || allOf?.length);

  if (!configured || !(hasSingle && hasAny && hasAll)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

interface PermissionRouteProps {
  /** Required for every matched child route. */
  permission?: Permission;
  /** Access granted when at least one of these is held. */
  anyOf?: readonly Permission[];
}

/**
 * Layout-route guard. Place inside <ProtectedRoute> so authentication is
 * already established; unauthorized users are redirected to /403 with the
 * attempted path in location.state.
 *
 *   <Route element={<PermissionRoute permission={PERMISSIONS.users.view} />}>
 *     <Route path="/users" element={<UsersPage />} />
 *   </Route>
 */
export function PermissionRoute({ permission, anyOf }: PermissionRouteProps) {
  const location = useLocation();
  const { can, canAny } = usePermissions();

  const allowed = permission
    ? can(permission)
    : anyOf
      ? canAny(anyOf)
      : false;

  if (!allowed) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
