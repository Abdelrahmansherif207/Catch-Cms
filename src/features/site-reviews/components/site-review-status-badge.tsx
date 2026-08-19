import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { SiteReviewStatus } from '../types/site-review.types';

const STATUS_STYLES: Record<SiteReviewStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

interface SiteReviewStatusBadgeProps {
  status: SiteReviewStatus;
  className?: string;
}

export function SiteReviewStatusBadge({ status, className }: SiteReviewStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {t(`siteReviews.status.${status}`)}
    </Badge>
  );
}