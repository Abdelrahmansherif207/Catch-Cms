import { axiosClient } from '@/shared/api';
import type {
  LoginData,
  LoginResponse,
  AuthData,
  ForgotPasswordData,
  ForgotPasswordResponse,
  ResetPasswordData,
  ResetPasswordResponse,
  ChangePasswordData,
  ChangePasswordResponse,
  SendOtpData,
  SendOtpResponse,
} from '../types/auth.types';

export async function login(data: LoginData): Promise<AuthData> {
  const { data: response } = await axiosClient.post<LoginResponse>('/admin-login', data);
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await axiosClient.post('/logout');
  } catch {
    // Logout endpoint might not exist, proceed anyway
  }
}

export async function forgotPassword(data: ForgotPasswordData): Promise<ForgotPasswordResponse> {
  const { data: response } = await axiosClient.post<ForgotPasswordResponse>('/forget-password', data);
  return response;
}

export async function resetPassword(data: ResetPasswordData): Promise<ResetPasswordResponse> {
  const { data: response } = await axiosClient.post<ResetPasswordResponse>('/reset-password', data);
  return response;
}

export async function changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
  const { data: response } = await axiosClient.post<ChangePasswordResponse>('/change-password', data);
  return response;
}

export async function sendOtpCode(data: SendOtpData): Promise<SendOtpResponse> {
  const { data: response } = await axiosClient.post<SendOtpResponse>('/send-otp-code', data);
  return response;
}
