import { useTranslation } from 'react-i18next';
import { Loader2, UserRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useProfile } from '../hooks/use-profile';
import { ProfileInfoCard } from '../components/profile-info-card';
import { PermissionsTab } from '../components/permissions-tab';
import { ChangePasswordForm } from '../components/change-password-form';

export function ProfilePage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
        <UserRound className="h-12 w-12" />
        <p className="text-sm">{t('profile.loadError')}</p>
      </div>
    );
  }

  const profile = data.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('profile.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('profile.subtitle')}</p>
      </div>

      <ProfileInfoCard profile={profile} />

      <Tabs defaultValue="permissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="permissions">
            {t('profile.permissions')}
          </TabsTrigger>
          <TabsTrigger value="changePassword">
            {t('profile.changePassword')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="permissions" className="rounded-xl border bg-card p-6 shadow-sm">
          <PermissionsTab permissions={profile.permissions} />
        </TabsContent>
        <TabsContent value="changePassword" className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">{t('auth.changePasswordTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('auth.changePasswordSubtitle')}</p>
            </div>
            <ChangePasswordForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
