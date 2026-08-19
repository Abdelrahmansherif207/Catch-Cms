import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import type {
  LoginData,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
} from '../types/auth.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string) {
  const apiError = error as ApiErrorResponse;
  toast.error(apiError?.message || fallbackMessage);
}

export function useLogin() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: LoginData) => login(data),
    onSuccess: (authData) => {
      setAuth(authData);
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      const apiError = error as ApiErrorResponse;
      const msg = apiError?.message || '';
      if (msg.includes('INVALID_CREDENTIALS')) {
        toast.error(t('auth.invalidCredentials'));
      } else if (msg.includes('USER_NOT_FOUND')) {
        toast.error(t('auth.userNotFound'));
      } else if (msg.includes('USER_NOT_VERIFIED')) {
        toast.error(t('auth.userNotVerified'));
      } else {
        toast.error(msg || t('auth.loginFailed'));
      }
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordData) => forgotPassword(data),
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to send reset email');
    },
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ResetPasswordData) => resetPassword(data),
    onSuccess: () => {
      toast.success('Password reset successful');
      navigate('/login');
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to reset password');
    },
  });
}

export function useChangePassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ChangePasswordData) => changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to change password');
    },
  });
}
