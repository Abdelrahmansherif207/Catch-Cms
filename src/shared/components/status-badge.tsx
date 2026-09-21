import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { isActiveStatus } from '@/shared/lib/status';

interface StatusBadgeProps {
  status: boolean | number | string | undefined;
  className?: string;
}

/**
 * Active / Inactive badge driven by semantic tokens
 * (bg-success-soft / bg-destructive-soft) — no hardcoded palette classes.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  // NB: plain Boolean("0") === true, so normalize explicitly.
  const isActive = isActiveStatus(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-normal',
        isActive
          ? 'border-transparent bg-success-soft text-success'
          : 'border-transparent bg-destructive-soft text-destructive',
        className
      )}
    >
      {isActive ? t('common.active') : t('common.inactive')}
    </Badge>
  );
}
