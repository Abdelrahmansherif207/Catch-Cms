import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { isActiveStatus } from '@/shared/lib/status';

interface StatusBadgeProps {
  status: boolean | number | string | undefined;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  // NB: plain Boolean("0") === true, so normalize explicitly.
  const isActive = isActiveStatus(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-normal',
        isActive
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        className
      )}
    >
      {isActive ? t('common.active') : t('common.inactive')}
    </Badge>
  );
}
