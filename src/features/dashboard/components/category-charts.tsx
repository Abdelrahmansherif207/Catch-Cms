import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/shared/ui/skeleton';
import { getLocalizedName } from '@/shared/lib/localize';
import type { CategoryStatsData } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';
import { ChartSwitcher } from './chart-switcher';
import type { ChartType } from './chart-switcher';
import { SimpleChartRenderer } from './chart-renderer';
import { useState } from 'react';

interface CategoryChartsProps {
  data: CategoryStatsData | undefined;
  isLoading: boolean;
  error: Error | null;
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{entry.name}</p>
      <p className="text-sm font-bold text-foreground">{formatCurrency(entry.value)}</p>
    </div>
  );
};

export function CategoryCharts({ data, isLoading, error }: CategoryChartsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [prodChartType, setProdChartType] = useState<ChartType>('bar');
  const [salesChartType, setSalesChartType] = useState<ChartType>('pie');

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.categoryStats.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
          {t('dashboard.errors.failedToLoad')}
        </div>
      </div>
    );
  }

  const productDist = (data?.product_distribution ?? []).map((item) => ({
    name: getLocalizedName(item.category_name, lang),
    value: item.product_count,
  }));

  const salesDist = data?.sales_distribution ?? [];

  const salesPieData = salesDist.map((item, index) => ({
    name: getLocalizedName(item.category_name, lang),
    value: item.total_sales,
    color: COLORS[index % COLORS.length],
  }));

  const salesBarData = salesDist.map((item) => ({
    name: getLocalizedName(item.category_name, lang),
    value: item.total_sales,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        {t('dashboard.categoryStats.title')}
      </h3>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('dashboard.categoryStats.productDistribution')}
              </h4>
              <ChartSwitcher type={prodChartType} onChange={setProdChartType} />
            </div>
            {productDist.length > 0 ? (
              <SimpleChartRenderer data={productDist} chartType={prodChartType} height={220} />
            ) : (
              <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                {t('dashboard.errors.noData')}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('dashboard.categoryStats.salesDistribution')}
              </h4>
              <ChartSwitcher type={salesChartType} onChange={setSalesChartType} showPie />
            </div>
            {salesPieData.length > 0 ? (
              salesChartType === 'pie' ? (
                <div className="h-[220px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={salesPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                        {salesPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8}
                        formatter={(value: string) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <SimpleChartRenderer data={salesBarData} chartType={salesChartType} formatter={formatCurrency} height={220} />
              )
            ) : (
              <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                {t('dashboard.errors.noData')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
