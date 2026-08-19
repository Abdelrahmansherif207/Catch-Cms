import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { useCoupon } from '../hooks/use-coupons';
import { CouponFormContent } from '../components/coupon-form-dialog';
import { AssignmentsSection } from '../components/assignments-section';

function EditPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="rounded-lg border bg-card p-6 space-y-6">
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/coupons')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('coupons.editCoupon')}
          </h1>
          <p className="text-muted-foreground">
            {t('coupons.subtitle')}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <CouponFormContent
          coupon={detail}
          onSuccess={() => navigate('/coupons')}
          onCancel={() => navigate('/coupons')}
        />
      </div>

      <AssignmentsSection couponId={detail.id} />
    </div>
  );
}
