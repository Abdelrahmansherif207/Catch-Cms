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
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    format: (v: number) => formatCurrency(v),
  },
  {
    key: 'total_orders',
    labelKey: 'dashboard.kpis.orders',
    icon: ShoppingCart,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    format: (v: number) => formatNumber(v),
  },
  {
    key: 'total_customers',
    labelKey: 'dashboard.kpis.customers',
    icon: Users,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    format: (v: number) => formatNumber(v),
  },
  {
    key: 'total_products',
    labelKey: 'dashboard.kpis.products',
    icon: Package,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    format: (v: number) => formatNumber(v),
  },
  {
    key: 'total_refunds',
    labelKey: 'dashboard.kpis.refunds',
    icon: RotateCcw,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    format: (v: number) => formatCurrency(v),
  },
];

export function KpiCards({ data, isLoading, error }: KpiCardsProps) {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
        {t('dashboard.errors.failedToLoad')}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const value = data ? (data as unknown as Record<string, number>)[kpi.key] : undefined;
        return (
          <div
            key={kpi.key}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-foreground/10"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t(kpi.labelKey)}
                </p>
                {isLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-xl font-bold tracking-tight text-foreground">
                    {value !== undefined ? kpi.format(value) : '—'}
                  </p>
                )}
              </div>
              <div className={`rounded-lg p-2.5 ${kpi.bgColor} ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            {kpi.key === 'total_revenue' && data?.todays_revenue !== undefined && (
              <div className="mt-3 border-t border-border pt-2">
                <p className="text-[11px] text-muted-foreground">
                  {t('dashboard.kpis.todaysRevenue')}: <span className="font-semibold text-foreground">{formatCurrency(data.todays_revenue)}</span>
                </p>
              </div>
            )}
            {kpi.key === 'total_customers' && data?.new_customers !== undefined && (
              <div className="mt-3 border-t border-border pt-2">
                <p className="text-[11px] text-muted-foreground">
                  {t('dashboard.kpis.newCustomers')}: <span className="font-semibold text-foreground">{formatNumber(data.new_customers)}</span>
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
