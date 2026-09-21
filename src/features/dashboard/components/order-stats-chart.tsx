import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Skeleton } from '@/shared/ui/skeleton';
import type { OrderStatsData, OrderStats } from '../types/dashboard.types';
import { ChartSwitcher } from './chart-switcher';
import type { ChartType } from './chart-switcher';
import { SimpleChartRenderer } from './chart-renderer';
import { ChartCard, ChartCardError } from './chart-card';

interface OrderStatsChartProps {
  data: OrderStatsData | undefined;
  isLoading: boolean;
  error: Error | null;
}

type TimeRange = 'today' | 'weekly' | 'monthly' | 'yearly';

const timeRanges: { key: TimeRange; labelKey: string }[] = [
  { key: 'today', labelKey: 'dashboard.orderStats.today' },
  { key: 'weekly', labelKey: 'dashboard.orderStats.weekly' },
  { key: 'monthly', labelKey: 'dashboard.orderStats.monthly' },
  { key: 'yearly', labelKey: 'dashboard.orderStats.yearly' },
];

const STATUS_CONFIG: Record<string, { labelKey: string; color: string }> = {
  pending: { labelKey: 'dashboard.orderStats.pending', color: 'var(--warning)' },
  processing: { labelKey: 'dashboard.orderStats.processing', color: 'var(--brand-processing)' },
  completed: { labelKey: 'dashboard.orderStats.completed', color: 'var(--success)' },
  cancelled: { labelKey: 'dashboard.orderStats.cancelled', color: 'var(--destructive)' },
  refunded: { labelKey: 'dashboard.orderStats.refunded', color: 'var(--muted-foreground)' },
  failed: { labelKey: 'dashboard.orderStats.failed', color: 'var(--chart-5)' },
  local_facility: { labelKey: 'dashboard.orderStats.localFacility', color: 'var(--primary)' },
  out_for_delivery: { labelKey: 'dashboard.orderStats.outForDelivery', color: 'var(--info)' },
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string | number; value: number }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{entry.name}</p>
      <p className="text-sm font-bold text-foreground">{entry.value} orders</p>
    </div>
  );
};

export function OrderStatsChart({ data, isLoading, error }: OrderStatsChartProps) {
  const { t } = useTranslation();
  const [activeRange, setActiveRange] = useState<TimeRange>('monthly');
  const [chartType, setChartType] = useState<ChartType>('pie');

  if (error) {
    return <ChartCardError title={t('dashboard.orderStats.title')} />;
  }

  const currentData: OrderStats | undefined = data ? data[activeRange] : undefined;

  const chartData = currentData
    ? Object.entries(currentData)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
          name: t(STATUS_CONFIG[key]?.labelKey ?? key),
          value,
          color: STATUS_CONFIG[key]?.color ?? 'var(--muted-foreground)',
        }))
    : [];

  return (
    <ChartCard
      title={t('dashboard.orderStats.title')}
      action={
        <div className="flex items-center gap-2">
          <ChartSwitcher type={chartType} onChange={setChartType} showPie />
          <div className="flex gap-1">
            {timeRanges.map((range) => (
              <button
                key={range.key}
                onClick={() => setActiveRange(range.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeRange === range.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t(range.labelKey)}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <Skeleton className="h-[250px] w-full rounded-xl" />
      ) : chartData.length > 0 ? (
        chartType === 'pie' ? (
          <div className="h-[250px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px' }}
                  iconSize={8}
                  formatter={(value: string) => (
                    <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <SimpleChartRenderer data={chartData} chartType={chartType} height={250} />
        )
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          {t('dashboard.errors.noData')}
        </div>
      )}
    </ChartCard>
  );
}
