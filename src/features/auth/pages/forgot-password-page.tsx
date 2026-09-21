import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { AuthCard } from '../components/auth-card';
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
    <AuthCard
      title={t('auth.forgotPasswordTitle')}
      subtitle={t('auth.forgotPasswordSubtitle')}
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('auth.backToLogin')}
        </Link>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
              size="lg"
              className="w-full"
              disabled={forgotMutation.isPending}
            >
              {forgotMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('auth.sending')}
                </>
              ) : (
                t('auth.sendResetLink')
              )}
            </Button>
      </form>
    </AuthCard>
  );
}
