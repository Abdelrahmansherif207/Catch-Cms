import { RefreshCw, Users, Globe, Repeat, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { useCouponUsageInfo } from '../hooks/use-coupons';

interface CouponUsageCardProps {
  couponId: number;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-muted/40 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold leading-tight">{value}</p>
    </div>
  );
}

export function CouponUsageCard({ couponId }: CouponUsageCardProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch, isFetching } = useCouponUsageInfo(couponId);
  const info = data?.data;

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{t('coupons.helper.usageTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('coupons.helper.usageSubtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => refetch()}
          disabled={isFetching}
          title={t('coupons.helper.refresh')}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading || !info ? (
        <div className="mt-4 space-y-2">
          {isError ? (
            <p className="text-sm text-destructive">{t('coupons.helper.loadError')}</p>
          ) : (
            <>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {info.coupon_code}
            </Badge>
            <Badge variant="outline">
              {info.coupon_type === 'public' ? (
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {t('coupons.helper.public')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {t('coupons.helper.assigned')}
                </span>
              )}
            </Badge>
            <Badge variant={info.is_multi_use_per_user ? 'default' : 'outline'}>
              {info.is_multi_use_per_user ? (
                <span className="inline-flex items-center gap-1">
                  <Repeat className="h-3 w-3" />
                  {t('coupons.helper.multiUse')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {t('coupons.helper.singleUse')}
                </span>
              )}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">{info.usage_model}</p>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">{t('coupons.helper.currentUsage')}</span>
              <span className="text-muted-foreground">
                {info.current_usage}
                {' / '}
                {info.global_limit === null
                  ? t('coupons.helper.unlimited')
                  : info.global_limit}
              </span>
            </div>
            {info.global_limit !== null && info.global_limit > 0 ? (
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: Math.min(100, (info.current_usage / info.global_limit) * 100) + '%',
                  }}
                />
              </div>
            ) : (
              <div className="h-2.5 w-full rounded-full bg-muted/60" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile
              label={t('coupons.helper.remaining')}
              value={
                info.remaining_capacity === 'unlimited'
                  ? t('coupons.helper.unlimited')
                  : info.remaining_capacity
              }
            />
            {info.coupon_type === 'public' ? (
              <StatTile
                label={t('coupons.helper.publicRedemptions')}
                value={info.public_usage_count}
              />
            ) : (
              <>
                <StatTile
                  label={t('coupons.helper.totalAssignments')}
                  value={info.assignment_info?.total_assignments ?? 0}
                />
                <StatTile
                  label={t('coupons.helper.withUsage')}
                  value={info.assignment_info?.assignments_with_usage ?? 0}
                />
                <StatTile
                  label={t('coupons.helper.possibleRedemptions')}
                  value={info.assignment_info?.total_possible_redemptions ?? 0}
                />
              </>
            )}
          </div>

          {info.coupon_type === 'assigned' && info.assignment_info && (
            <p className="text-xs text-muted-foreground">
              {t('coupons.helper.maxPerUser')}: {info.assignment_info.max_uses_per_user}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
