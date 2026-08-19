export interface LoginData {
  email?: string;
  phone_number?: string;
  password: string;
}

export interface LoginResponse {
  status: number;
  message: string;
  success: boolean;
  data: AuthData;
}

export interface AuthData {
  token: string;
  permissions: string[];
  email_verified: boolean;
  role: string[];
}

export interface User {
  email?: string;
  phone_number?: string;
  role: string[];
  permissions: string[];
  email_verified: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ForgotPasswordResponse {
  status: number;
  message: string;
  success: boolean;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordResponse {
  status: number;
  message: string;
  success: boolean;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  newPassword_confirmation: string;
}

export interface ChangePasswordResponse {
  status: number;
  message: string;
  success: boolean;
}

export interface SendOtpData {
  email: string;
}

export interface SendOtpResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    otp: string;
    id: string;
  };
}
