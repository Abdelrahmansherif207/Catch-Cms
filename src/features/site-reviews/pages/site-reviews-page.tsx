import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/components/pagination';
import { usePermissions } from '@/shared/auth/guards';
import { SITE_REVIEW_PERMISSIONS } from '../permissions/site-reviews.permissions';
import {
  useSiteReviews,
  useApproveSiteReview,
  useRejectSiteReview,
} from '../hooks/use-site-reviews';
import { SiteReviewsTable } from '../components/site-reviews-table';
import { SiteReviewDetailDialog } from '../components/site-review-detail-dialog';
import type { SiteReview, SiteReviewStatus } from '../types/site-review.types';

export function SiteReviewsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [statusFilter, setStatusFilter] = useState<SiteReviewStatus | 'all'>('all');
  const [viewReviewId, setViewReviewId] = useState<number | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const { can: hasPermission } = usePermissions();
  const canApprove = hasPermission(SITE_REVIEW_PERMISSIONS.approve);
  const canReject = hasPermission(SITE_REVIEW_PERMISSIONS.reject);

  const approveMutation = useApproveSiteReview();
  const rejectMutation = useRejectSiteReview();

  const params = {
    page,
    limit: perPage,
    status: statusFilter === 'all' ? '' : (statusFilter as SiteReviewStatus),
  };

  const { data, isLoading, isError, refetch } = useSiteReviews(params);

  const reviews = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;
  const hasActiveFilters = statusFilter !== 'all';

  const handleView = (review: SiteReview) => {
    setViewReviewId(review.id);
    setOpenDetail(true);
  };

  const handleApprove = (review: SiteReview) => {
    setApprovingId(review.id);
    approveMutation.mutate(review.id, {
      onSettled: () => setApprovingId(null),
    });
  };

  const handleReject = (review: SiteReview) => {
    setRejectingId(review.id);
    rejectMutation.mutate(review.id, {
      onSettled: () => setRejectingId(null),
    });
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{t('siteReviews.pageTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('siteReviews.pageDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            if (!v) return;
            setStatusFilter(v as SiteReviewStatus | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-full md:w-[150px]">
            <SelectValue placeholder={t('siteReviews.statusFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('siteReviews.all')}</SelectItem>
            <SelectItem value="pending">{t('siteReviews.status.pending')}</SelectItem>
            <SelectItem value="approved">{t('siteReviews.status.approved')}</SelectItem>
            <SelectItem value="rejected">{t('siteReviews.status.rejected')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(perPage)}
          onValueChange={(v) => {
            setPerPage(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-full md:w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SiteReviewsTable
        data={reviews}
        isLoading={isLoading}
        isError={isError}
        canApprove={canApprove}
        canReject={canReject}
        hasActiveFilters={hasActiveFilters}
        onRefresh={() => refetch()}
        onView={handleView}
        onApprove={handleApprove}
        onReject={handleReject}
        onClearFilters={clearFilters}
        approvingId={approvingId}
        rejectingId={rejectingId}
      />

      <Pagination
        page={page}
        lastPage={lastPage}
        total={total}
        from={from}
        to={to}
        perPage={perPage}
        onPageChange={setPage}
      />

      <SiteReviewDetailDialog
        reviewId={viewReviewId}
        open={openDetail}
        onOpenChange={setOpenDetail}
        canApprove={canApprove}
        canReject={canReject}
        approveMutation={approveMutation}
        rejectMutation={rejectMutation}
      />
    </div>
  );
}