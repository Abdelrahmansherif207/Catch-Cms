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
  pending: { labelKey: 'dashboard.orderStats.pending', color: '#CF9E36' },
  processing: { labelKey: 'dashboard.orderStats.processing', color: '#E67E22' },
  completed: { labelKey: 'dashboard.orderStats.completed', color: '#3DB87A' },
  cancelled: { labelKey: 'dashboard.orderStats.cancelled', color: '#EF4444' },
  refunded: { labelKey: 'dashboard.orderStats.refunded', color: '#8B8FA3' },
  failed: { labelKey: 'dashboard.orderStats.failed', color: '#DC2626' },
  local_facility: { labelKey: 'dashboard.orderStats.localFacility', color: '#6366F1' },
  out_for_delivery: { labelKey: 'dashboard.orderStats.outForDelivery', color: '#0EA5E9' },
};

const CustomTooltip = ({ active, payload }: any) => {
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
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.orderStats.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
          {t('dashboard.errors.failedToLoad')}
        </div>
      </div>
    );
  }

  const currentData: OrderStats | undefined = data ? data[activeRange] : undefined;

  const chartData = currentData
    ? Object.entries(currentData)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
          name: t(STATUS_CONFIG[key]?.labelKey ?? key),
          value,
          color: STATUS_CONFIG[key]?.color ?? '#8B8FA3',
        }))
    : [];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t('dashboard.orderStats.title')}
        </h3>
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
      </div>

      {isLoading ? (
        <Skeleton className="h-[250px] w-full rounded-lg" />
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
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          {t('dashboard.errors.noData')}
        </div>
      )}
    </div>
  );
}
