import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthData, User } from '../types/auth.types';
import { STORAGE_KEYS } from '@/shared/constants/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (data: AuthData) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
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

      hasPermission: (permission: string) => {
        const { user } = get();
        return user?.permissions.includes(permission) ?? false;
      },

      hasRole: (role: string) => {
        const { user } = get();
        return user?.role.includes(role) ?? false;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
