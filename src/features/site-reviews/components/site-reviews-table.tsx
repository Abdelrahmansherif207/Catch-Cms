import { RefreshCw, Eye, Check, X, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import { SiteReviewStatusBadge } from './site-review-status-badge';
import type { SiteReview } from '../types/site-review.types';

interface SiteReviewsTableProps {
  data: SiteReview[];
  isLoading: boolean;
  isError: boolean;
  canApprove: boolean;
  canReject: boolean;
  hasActiveFilters: boolean;
  onRefresh: () => void;
  onView: (review: SiteReview) => void;
  onApprove: (review: SiteReview) => void;
  onReject: (review: SiteReview) => void;
  onClearFilters: () => void;
  approvingId: number | null;
  rejectingId: number | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return dateStr.split('T')[0];
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

export function SiteReviewsTable({
  data,
  isLoading,
  isError,
  canApprove,
  canReject,
  hasActiveFilters,
  onRefresh,
  onView,
  onApprove,
  onReject,
  onClearFilters,
  approvingId,
  rejectingId,
}: SiteReviewsTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-16">
        <p className="text-sm text-muted-foreground">{t('siteReviews.loadError')}</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="me-2 h-4 w-4" />
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const showActions = canApprove || canReject;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">{t('siteReviews.id')}</TableHead>
            <TableHead>{t('siteReviews.customer')}</TableHead>
            <TableHead>{t('siteReviews.rating')}</TableHead>
            <TableHead className="min-w-[140px]">{t('siteReviews.title')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('siteReviews.comment')}</TableHead>
            <TableHead>{t('siteReviews.statusLabel')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('siteReviews.moderator')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('siteReviews.moderatedAt')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('siteReviews.created')}</TableHead>
            {showActions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 10 : 9} className="h-48 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Star className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {t(hasActiveFilters ? 'siteReviews.noPending' : 'siteReviews.empty')}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={onClearFilters}>
                        {t('siteReviews.clearFilters')}
                      </Button>
                    )}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((review) => {
              const isApproving = approvingId === review.id;
              const isRejecting = rejectingId === review.id;
              const isPending = review.status === 'pending';

              return (
                <TableRow key={review.id} className="cursor-pointer" onClick={() => onView(review)}>
                  <TableCell className="text-xs text-muted-foreground">{review.id}</TableCell>
                  <TableCell>
                    <p className="font-medium">{review.customer?.name ?? t('siteReviews.noCustomer')}</p>
                    <p className="text-xs text-muted-foreground">{review.customer?.email ?? ''}</p>
                  </TableCell>
                  <TableCell>
                    <RatingStars rating={review.rating} />
                  </TableCell>
                  <TableCell>
                    <p className="truncate max-w-[160px] font-medium">{review.title}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="truncate max-w-[220px] text-sm text-muted-foreground">{review.comment}</p>
                  </TableCell>
                  <TableCell>
                    <SiteReviewStatusBadge status={review.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {review.moderator ? review.moderator.name : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell whitespace-nowrap">
                    {formatDate(review.moderated_at)}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell whitespace-nowrap">
                    {formatDate(review.created_at)}
                  </TableCell>
                  {showActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => onView(review)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isPending && canApprove && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-green-600 hover:text-green-700"
                            disabled={isRejecting}
                            onClick={() => onApprove(review)}
                          >
                            <Check className={cn('h-4 w-4', isApproving && 'animate-pulse')} />
                          </Button>
                        )}
                        {isPending && canReject && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            disabled={isApproving}
                            onClick={() => onReject(review)}
                          >
                            <X className={cn('h-4 w-4', isRejecting && 'animate-pulse')} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSkeleton() {
  const showActions = true;
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead />
            <TableHead />
            <TableHead />
            <TableHead className="hidden md:table-cell" />
            <TableHead />
            <TableHead className="hidden lg:table-cell" />
            <TableHead className="hidden lg:table-cell" />
            <TableHead className="hidden sm:table-cell" />
            {showActions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-6" /></TableCell>
              <TableCell><Skeleton className="h-8 w-28" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}