import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

interface UserStatusBadgeProps {
  status: boolean | number;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const { t } = useTranslation();
  const isActive = Boolean(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-normal',
        isActive
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      )}
    >
      {isActive ? t('users.active') : t('users.inactive')}
    </Badge>
  );
}
