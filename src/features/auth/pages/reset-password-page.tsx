import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Key, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useResetPassword } from '../hooks/use-auth';
import {
  resetPasswordSchema,
  resetPasswordDefaults,
  type ResetPasswordFormData,
} from '../schemas/auth.schema';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const resetMutation = useResetPassword();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { ...resetPasswordDefaults, email: emailParam },
  });

  const onSubmit = (values: ResetPasswordFormData) => {
    resetMutation.mutate(values);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-8 shadow-lg">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/logo.jpg" alt="Catch Logo" className="mb-6 h-12 w-auto rounded-lg" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {t('auth.resetPasswordTitle')}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('auth.resetPasswordSubtitle')}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={!!emailParam}
                  {...form.register('email')}
                  className="ps-9"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">
                {t('auth.otp')}
              </label>
              <div className="relative">
                <Key className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="otp"
                  placeholder="123456"
                  autoComplete="one-time-code"
                  {...form.register('otp')}
                  className="ps-9"
                />
              </div>
              {form.formState.errors.otp && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.otp.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...form.register('password')}
                  className="ps-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute end-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password_confirmation" className="text-sm font-medium">
                {t('auth.confirmNewPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password_confirmation"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...form.register('password_confirmation')}
                  className="ps-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute end-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.password_confirmation && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password_confirmation.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.resetting')}
                </>
              ) : (
                t('auth.resetPassword')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
