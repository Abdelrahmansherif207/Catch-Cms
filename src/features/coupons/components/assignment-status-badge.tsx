import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

interface AssignmentStatusBadgeProps {
  isExpired: boolean;
  remaining: number;
  expiresAt: string | null;
}

function getDaysUntilExpiry(expiresAt: string): number {
  return Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

export function AssignmentStatusBadge({ isExpired, remaining, expiresAt }: AssignmentStatusBadgeProps) {
  const { t } = useTranslation();

  if (isExpired) {
    return (
      <Badge variant="outline" className="border-transparent bg-destructive-soft font-normal text-destructive">
        {t('coupons.assignments.expired', { defaultValue: 'Expired' })}
      </Badge>
    );
  }

  if (remaining <= 0) {
    return (
      <Badge variant="outline" className="border-transparent bg-muted font-normal text-muted-foreground">
        {t('coupons.assignments.exhausted', { defaultValue: 'Exhausted' })}
      </Badge>
    );
  }

  if (expiresAt) {
    const daysUntilExpiry = getDaysUntilExpiry(expiresAt);
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      return (
        <Badge variant="outline" className={cn('border-transparent bg-warning-soft font-normal text-warning')}>
          {t('coupons.assignments.expiringSoon', { defaultValue: 'Expiring soon' })}
        </Badge>
      );
    }
  }

  return (
    <Badge variant="outline" className="border-transparent bg-success-soft font-normal text-success">
      {t('coupons.assignments.active', { defaultValue: 'Active' })}
    </Badge>
  );
}
