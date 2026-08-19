import { z } from 'zod';

export const userFormSchema = z
  .object({
    name: z.string().min(1, 'validation.nameRequired'),
    email: z.string().min(1, 'validation.emailRequired').email('validation.emailInvalid'),
    password: z.string().min(8, 'validation.passwordMin'),
    passwordConfirmation: z.string().min(1, 'validation.passwordConfirmationRequired'),
    phoneNumber: z.string().min(8, 'validation.phoneNumberMin'),
    roleIds: z.array(z.number()).min(1, 'validation.rolesRequired'),
    isActive: z.string().default('1'),
    image: z.instanceof(File).optional(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'validation.passwordMismatch',
    path: ['passwordConfirmation'],
  });

export type UserFormValues = z.infer<typeof userFormSchema>;

export const userFormDefaults: UserFormValues = {
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  phoneNumber: '',
  roleIds: [],
  isActive: '1',
};

export function toApiFormat(values: UserFormValues) {
  return {
    name: values.name,
    email: values.email,
    password: values.password,
    password_confirmation: values.passwordConfirmation,
    phone_number: values.phoneNumber,
    roles: values.roleIds,
    is_active: (values.isActive === '1' ? 1 : 0) as 0 | 1,
    image: values.image,
  };
}

export function getPasswordStrength(password: string): { label: string; color: string; percent: number } {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;

  if (score < 30) return { label: 'Weak', color: 'bg-red-500', percent: 25 };
  if (score < 50) return { label: 'Fair', color: 'bg-orange-500', percent: 50 };
  if (score < 70) return { label: 'Good', color: 'bg-yellow-500', percent: 70 };
  return { label: 'Strong', color: 'bg-green-500', percent: 100 };
}
