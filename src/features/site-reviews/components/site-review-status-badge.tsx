import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { SiteReviewStatus } from '../types/site-review.types';

const STATUS_STYLES: Record<SiteReviewStatus, string> = {
  pending: 'border-transparent bg-warning-soft text-warning',
  approved: 'border-transparent bg-success-soft text-success',
  rejected: 'border-transparent bg-destructive-soft text-destructive',
};

interface SiteReviewStatusBadgeProps {
  status: SiteReviewStatus;
  className?: string;
}

export function SiteReviewStatusBadge({ status, className }: SiteReviewStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={cn('font-normal', STATUS_STYLES[status], className)}>
      {t(`siteReviews.status.${status}`)}
    </Badge>
  );
}