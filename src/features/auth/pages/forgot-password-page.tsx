import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useForgotPassword } from '../hooks/use-auth';
import {
  forgotPasswordSchema,
  forgotPasswordDefaults,
  type ForgotPasswordFormData,
} from '../schemas/auth.schema';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const forgotMutation = useForgotPassword();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: forgotPasswordDefaults,
  });

  const onSubmit = (values: ForgotPasswordFormData) => {
    forgotMutation.mutate(values, {
      onSuccess: () => {
        navigate(`/reset-password?email=${encodeURIComponent(values.email)}`);
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-8 shadow-lg">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/logo.jpg" alt="Catch Logo" className="mb-6 h-12 w-auto rounded-lg" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {t('auth.forgotPasswordTitle')}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('auth.forgotPasswordSubtitle')}
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
                  placeholder="admin@demo.com"
                  autoComplete="email"
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

            <Button
              type="submit"
              className="w-full"
              disabled={forgotMutation.isPending}
            >
              {forgotMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.sending')}
                </>
              ) : (
                t('auth.sendResetLink')
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
