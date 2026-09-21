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
import { ChartCard, ChartCardError } from './chart-card';

interface CategoryChartsProps {
  data: CategoryStatsData | undefined;
  isLoading: boolean;
  error: Error | null;
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string | number; value: number }>;
}

const PieTooltip = ({ active, payload }: PieTooltipProps) => {
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
    return <ChartCardError title={t('dashboard.categoryStats.title')} />;
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
    <ChartCard title={t('dashboard.categoryStats.title')}>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-2xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t('dashboard.categoryStats.productDistribution')}
              </h4>
              <ChartSwitcher type={prodChartType} onChange={setProdChartType} />
            </div>
            {productDist.length > 0 ? (
              <SimpleChartRenderer data={productDist} chartType={prodChartType} height={220} />
            ) : (
              <div className="flex h-[150px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
                {t('dashboard.errors.noData')}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-2xs font-semibold tracking-wider text-muted-foreground uppercase">
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
              <div className="flex h-[150px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
                {t('dashboard.errors.noData')}
              </div>
            )}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
