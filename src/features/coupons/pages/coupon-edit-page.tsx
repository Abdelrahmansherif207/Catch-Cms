import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { PageBackHeader } from '@/shared/components/page-header';
import { useCoupon } from '../hooks/use-coupons';
import { CouponFormContent } from '../components/coupon-form-dialog';
import { TargetingSection } from '../components/targeting-section';
import { AssignmentsSection } from '../components/assignments-section';
import { CouponUsageCard } from '../components/coupon-usage-card';
import { SuggestFixPanel } from '../components/suggest-fix-panel';

function EditPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-6 space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function CouponEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data, isLoading } = useCoupon(Number(id));
  const detail = data?.data;

  if (isLoading) {
    return <EditPageSkeleton />;
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">{t('common.noData')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/coupons')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={t('coupons.editCoupon')}
        description={t('coupons.subtitle')}
        backTo="/coupons"
      />

      <CouponUsageCard couponId={detail.id} />

      <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-6">
        <CouponFormContent
          coupon={detail}
          onSuccess={() => navigate('/coupons')}
          onCancel={() => navigate('/coupons')}
        />
      </div>

      <TargetingSection couponId={detail.id} />

      <AssignmentsSection couponId={detail.id} />

      <SuggestFixPanel couponId={detail.id} />
    </div>
  );
}
