import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/ui/skeleton';
import { getLocalizedName } from '@/shared/lib/localize';
import type { DashboardCategoriesData } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';
import { ChartSwitcher } from './chart-switcher';
import type { ChartType } from './chart-switcher';
import { SimpleChartRenderer, MultiSeriesChartRenderer } from './chart-renderer';
import { useState } from 'react';

interface CategoryAnalyticsProps {
  data: DashboardCategoriesData | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function CategoryAnalytics({ data, isLoading, error }: CategoryAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [prodType, setProdType] = useState<ChartType>('bar');
  const [highRevType, setHighRevType] = useState<ChartType>('bar');
  const [lowRevType, setLowRevType] = useState<ChartType>('bar');
  const [growthType, setGrowthType] = useState<ChartType>('bar');

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.categories.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">{t('dashboard.errors.failedToLoad')}</div>
      </div>
    );
  }

  const productDist = (data?.product_distribution ?? []).map((item) => ({
    name: getLocalizedName(item.category_name, lang),
    value: item.product_count,
  }));

  const highestRev = (data?.highest_revenue ?? []).map((item) => ({
    name: getLocalizedName(item.category_name, lang),
    value: item.revenue,
  }));

  const lowestRev = (data?.lowest_revenue ?? []).map((item) => ({
    name: getLocalizedName(item.category_name, lang),
    value: item.revenue,
  }));

  const growthData = (data?.category_growth ?? []).map((item) => ({
    name: getLocalizedName(item.category_name, lang),
    current_month: item.current_month,
    previous_month: item.previous_month,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.categories.title')}</h3>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[220px] w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-4"><Skeleton className="h-[200px] rounded-lg" /><Skeleton className="h-[200px] rounded-lg" /></div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.categories.productDistribution')}</h4>
              <ChartSwitcher type={prodType} onChange={setProdType} />
            </div>
            {productDist.length > 0 ? (
              <SimpleChartRenderer data={productDist} chartType={prodType} height={220} />
            ) : (
              <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.categories.highestRevenue')}</h4>
                <ChartSwitcher type={highRevType} onChange={setHighRevType} />
              </div>
              {highestRev.length > 0 ? (
                <SimpleChartRenderer data={highestRev} chartType={highRevType} formatter={formatCurrency} height={200} />
              ) : (
                <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.categories.lowestRevenue')}</h4>
                <ChartSwitcher type={lowRevType} onChange={setLowRevType} />
              </div>
              {lowestRev.length > 0 ? (
                <SimpleChartRenderer data={lowestRev} chartType={lowRevType} formatter={formatCurrency} height={200} />
              ) : (
                <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.categories.growth')}</h4>
              <ChartSwitcher type={growthType} onChange={setGrowthType} />
            </div>
            {growthData.length > 0 ? (
              <MultiSeriesChartRenderer
                data={growthData}
                chartType={growthType}
                dataKeys={[
                  { key: 'current_month', name: t('dashboard.categories.currentMonth'), color: 'var(--chart-1)' },
                  { key: 'previous_month', name: t('dashboard.categories.previousMonth'), color: 'var(--chart-3)' },
                ]}
                formatter={formatCurrency}
                height={200}
              />
            ) : (
              <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">{t('dashboard.errors.noData')}</div>
      )}
    </div>
  );
}
