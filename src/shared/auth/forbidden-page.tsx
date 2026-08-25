import { useTranslation } from 'react-i18next';
import { ShieldX } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { usePermissions } from './guards';

export function ForbiddenPage() {
  const { t } = useTranslation();
  const { isSuperAdmin } = usePermissions();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <ShieldX className="h-14 w-14 text-destructive" />
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('common.forbidden.title')}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {isSuperAdmin
            ? t('common.forbidden.descriptionSuperAdmin')
            : t('common.forbidden.description')}
        </p>
      </div>
      <Button variant="outline" onClick={() => window.history.back()}>
        {t('common.forbidden.goBack')}
      </Button>
    </div>
  );
}
