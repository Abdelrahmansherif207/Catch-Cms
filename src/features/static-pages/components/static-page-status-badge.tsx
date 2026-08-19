import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';

export function StaticPageStatusBadge({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
          : 'border-muted bg-muted/50 text-muted-foreground'
      }
    >
      {isActive ? t('staticPages.active') : t('staticPages.inactive')}
    </Badge>
  );
}