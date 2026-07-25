import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { loginSchema, loginDefaults, type LoginFormData } from '../schemas/auth.schema';
import { useLogin } from '../hooks/use-auth';

export function LoginPage() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaults,
  });

  const onSubmit = (values: LoginFormData) => {
    const isEmail = values.identifier.includes('@');
    const payload = {
      password: values.password,
      ...(isEmail ? { email: values.identifier } : { phone_number: values.identifier }),
    };
    loginMutation.mutate(payload);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-8 shadow-lg">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/logo.jpg" alt="Catch Logo" className="mb-6 h-12 w-auto rounded-lg" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {t('auth.welcomeBack')}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('auth.signInSubtitle')}
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm font-medium">
                {t('auth.emailOrPhone')}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="identifier"
                  placeholder="admin@demo.com"
                  autoComplete="username"
                  {...form.register('identifier')}
                  className="ps-9"
                />
              </div>
              {form.formState.errors.identifier && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.identifier.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
