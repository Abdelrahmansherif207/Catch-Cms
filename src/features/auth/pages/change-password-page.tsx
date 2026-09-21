import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { AuthCard } from '../components/auth-card';
import { ChangePasswordForm } from '@/features/profile/components/change-password-form';

export function ChangePasswordPage() {
  const { t } = useTranslation();

  return (
    <AuthCard
      title={t('auth.changePasswordTitle')}
      subtitle={t('auth.changePasswordSubtitle')}
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
      <ChangePasswordForm />
    </AuthCard>
  );
}
