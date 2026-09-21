import { useTranslation } from 'react-i18next';
import { DollarSign, ShoppingCart, Users, Package, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import type { DashboardOverview } from '../types/dashboard.types';
import { formatCurrency, formatNumber } from '../lib/dashboard-utils';

interface KpiCardsProps {
  data: DashboardOverview | undefined;
  isLoading: boolean;
  error: Error | null;
}

const kpis = [
  {
    key: 'total_revenue',
    labelKey: 'dashboard.kpis.totalRevenue',
    icon: DollarSign,
    color: 'text-info',
    bgColor: 'bg-info-soft',
    format: (v: number) => formatCurrency(v),
  },
  {
    key: 'total_orders',
    labelKey: 'dashboard.kpis.orders',
    icon: ShoppingCart,
    color: 'text-success',
    bgColor: 'bg-success-soft',
    format: (v: number) => formatNumber(v),
  },
  {
    key: 'total_customers',
    labelKey: 'dashboard.kpis.customers',
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    format: (v: number) => formatNumber(v),
  },
  {
    key: 'total_products',
    labelKey: 'dashboard.kpis.products',
    icon: Package,
    color: 'text-warning',
    bgColor: 'bg-warning-soft',
    format: (v: number) => formatNumber(v),
  },
  {
    key: 'total_refunds',
    labelKey: 'dashboard.kpis.refunds',
    icon: RotateCcw,
    color: 'text-destructive',
    bgColor: 'bg-destructive-soft',
    format: (v: number) => formatCurrency(v),
  },
];

export function KpiCards({ data, isLoading, error }: KpiCardsProps) {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive-soft p-4 text-destructive text-sm">
        {t('dashboard.errors.failedToLoad')}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const value = data ? (data as unknown as Record<string, number>)[kpi.key] : undefined;
        return (
          <div
            key={kpi.key}
            className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <p className="text-2xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {t(kpi.labelKey)}
                </p>
                {isLoading ? (
                  <Skeleton className="h-9 w-28 rounded-lg" />
                ) : (
                  <p className="truncate text-[1.75rem] leading-9 font-bold tracking-tight text-foreground tabular-nums">
                    {value !== undefined ? kpi.format(value) : '—'}
                  </p>
                )}
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.bgColor} ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
            </div>
            {kpi.key === 'total_revenue' && data?.todays_revenue !== undefined && (
              <div className="mt-4 border-t pt-3">
                <p className="flex items-center justify-between text-[13px] text-muted-foreground">
                  {t('dashboard.kpis.todaysRevenue')}
                  <span className="font-semibold text-foreground tabular-nums">{formatCurrency(data.todays_revenue)}</span>
                </p>
              </div>
            )}
            {kpi.key === 'total_customers' && data?.new_customers !== undefined && (
              <div className="mt-4 border-t pt-3">
                <p className="flex items-center justify-between text-[13px] text-muted-foreground">
                  {t('dashboard.kpis.newCustomers')}
                  <span className="font-semibold text-foreground tabular-nums">{formatNumber(data.new_customers)}</span>
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
