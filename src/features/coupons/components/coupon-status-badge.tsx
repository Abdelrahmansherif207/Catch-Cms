import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

interface CouponStatusBadgeProps {
  status: boolean;
}

export function CouponStatusBadge({ status }: CouponStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-normal',
        status
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      )}
    >
      {status ? t('coupons.active') : t('coupons.inactive')}
    </Badge>
  );
}
