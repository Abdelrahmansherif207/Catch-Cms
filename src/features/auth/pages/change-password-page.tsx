import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { ChangePasswordForm } from '@/features/profile/components/change-password-form';

export function ChangePasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-8 shadow-lg">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src="/logo.jpg" alt="Catch Logo" className="mb-6 h-12 w-auto rounded-lg" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {t('auth.changePasswordTitle')}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('auth.changePasswordSubtitle')}
            </p>
          </div>

          <ChangePasswordForm />

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
