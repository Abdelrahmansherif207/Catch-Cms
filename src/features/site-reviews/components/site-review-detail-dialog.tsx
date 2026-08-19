import { useTranslation } from 'react-i18next';
import { Star, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import { useSiteReview, useApproveSiteReview, useRejectSiteReview } from '../hooks/use-site-reviews';
import { SiteReviewStatusBadge } from './site-review-status-badge';

interface SiteReviewDetailDialogProps {
  reviewId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canApprove: boolean;
  canReject: boolean;
  approveMutation: ReturnType<typeof useApproveSiteReview>;
  rejectMutation: ReturnType<typeof useRejectSiteReview>;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SiteReviewDetailDialog({
  reviewId,
  open,
  onOpenChange,
  canApprove,
  canReject,
  approveMutation,
  rejectMutation,
}: SiteReviewDetailDialogProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useSiteReview(open ? reviewId : null);

  const review = data?.data;
  const isPending = review?.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t('siteReviews.detailTitle')}</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : review ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SiteReviewStatusBadge status={review.status} />
                <span className="text-xs text-muted-foreground">#{review.id}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {t('siteReviews.created')}: {formatDate(review.created_at)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                    )}
                  />
                ))}
                <span className="text-sm text-muted-foreground">({review.rating}/5)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('siteReviews.title')}</label>
              <p className="text-sm font-medium">{review.title}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('siteReviews.customer')}</label>
                <p className="text-sm">{review.customer?.name ?? t('siteReviews.noCustomer')}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('siteReviews.email')}</label>
                <p className="text-sm">{review.customer?.email ?? '—'}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('siteReviews.moderator')}</label>
                <p className="text-sm">{review.moderator ? review.moderator.name : '—'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('siteReviews.moderatedAt')}</label>
                <p className="text-sm">{formatDate(review.moderated_at)}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('siteReviews.comment')}</label>
              <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted p-3">{review.comment}</p>
            </div>
          </div>
        ) : null}

        {review && isPending && (canApprove || canReject) ? (
          <DialogFooter>
            {canReject && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={rejectMutation.isPending || approveMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate(review.id, {
                    onSuccess: () => onOpenChange(false),
                  })
                }
              >
                <X className="me-2 h-4 w-4" />
                {rejectMutation.isPending ? t('siteReviews.rejecting') : t('siteReviews.reject')}
              </Button>
            )}
            {canApprove && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={rejectMutation.isPending || approveMutation.isPending}
                onClick={() =>
                  approveMutation.mutate(review.id, {
                    onSuccess: () => onOpenChange(false),
                  })
                }
              >
                <Check className="me-2 h-4 w-4" />
                {approveMutation.isPending ? t('siteReviews.approving') : t('siteReviews.approve')}
              </Button>
            )}
          </DialogFooter>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}