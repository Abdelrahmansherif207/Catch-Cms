import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthData, User } from '../types/auth.types';
import { STORAGE_KEYS } from '@/shared/constants/api';
import { SUPER_ADMIN_ROLE, type Permission, type RoleType } from '@/shared/auth/permissions';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (data: AuthData) => void;
  clearAuth: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: RoleType) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (data: AuthData) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        set({
          token: data.token,
          user: {
            role: data.role,
            permissions: data.permissions,
            email_verified: data.email_verified,
          },
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      /**
       * Exact-match check against the grants issued at login.
       * The `permission` parameter is the literal union from
       * shared/auth/permissions.ts, so invalid strings cannot compile.
       * super_admin bypasses all checks client-side, mirroring backend policy.
       */
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role?.includes(SUPER_ADMIN_ROLE)) return true;
        return user.permissions.includes(permission);
      },

      hasRole: (role) => {
        const { user } = get();
        return user?.role.includes(role) ?? false;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
