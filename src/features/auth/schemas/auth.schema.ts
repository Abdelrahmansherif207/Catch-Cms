import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const loginDefaults: LoginFormData = {
  identifier: '',
  password: '',
};

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const forgotPasswordDefaults: ForgotPasswordFormData = {
  email: '',
};

export const resetPasswordSchema = z
  .object({
    email: z.string().email('Valid email is required'),
    otp: z.string().min(1, 'OTP is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const resetPasswordDefaults: ResetPasswordFormData = {
  email: '',
  otp: '',
  password: '',
  password_confirmation: '',
};

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    newPassword_confirmation: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.newPassword_confirmation, {
    message: 'Passwords do not match',
    path: ['newPassword_confirmation'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const changePasswordDefaults: ChangePasswordFormData = {
  oldPassword: '',
  newPassword: '',
  newPassword_confirmation: '',
};
