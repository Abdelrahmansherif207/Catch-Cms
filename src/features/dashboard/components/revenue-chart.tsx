import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Skeleton } from '@/shared/ui/skeleton';
import type { RevenueData } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';

interface RevenueChartProps {
  data: RevenueData | undefined;
  isLoading: boolean;
  error: Error | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

export function RevenueChart({ data, isLoading, error }: RevenueChartProps) {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          {t('dashboard.revenue.title')}
        </h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
          {t('dashboard.errors.failedToLoad')}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('dashboard.revenue.title')}
          </h3>
          {data && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('dashboard.revenue.total')}: {formatCurrency(data.total_revenue)} &middot;{' '}
              {t('dashboard.revenue.today')}: {formatCurrency(data.todays_revenue)}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      ) : data?.monthly_breakdown && data.monthly_breakdown.length > 0 ? (
        <div className="h-[300px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.monthly_breakdown}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatCurrency(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)' }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--chart-1)', strokeWidth: 2, stroke: 'var(--card)' }}
                activeDot={{ r: 6, fill: 'var(--chart-1)', strokeWidth: 2, stroke: 'var(--card)' }}
                name={t('dashboard.revenue.monthlyRevenue')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          {t('dashboard.errors.noData')}
        </div>
      )}
    </div>
  );
}
