import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Skeleton } from '@/shared/ui/skeleton';
import type { DashboardOrdersData, TimelineEntry } from '../types/dashboard.types';
import { formatCurrency, formatNumber } from '../lib/dashboard-utils';

interface OrderAnalyticsProps {
  data: DashboardOrdersData | undefined;
  isLoading: boolean;
  error: Error | null;
}

type Period = 'daily' | 'weekly' | 'monthly';

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

const LineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold text-foreground" style={{ color: entry.color }}>
          {entry.name}: {entry.dataKey === 'orders' ? formatNumber(entry.value) : formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{payload[0].name}</p>
      <p className="text-sm font-bold text-foreground">{payload[0].value}%</p>
    </div>
  );
};

export function OrderAnalytics({ data, isLoading, error }: OrderAnalyticsProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('daily');

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.orders.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">{t('dashboard.errors.failedToLoad')}</div>
      </div>
    );
  }

  const periods: { key: Period; labelKey: string }[] = [
    { key: 'daily', labelKey: 'dashboard.orders.daily' },
    { key: 'weekly', labelKey: 'dashboard.orders.weekly' },
    { key: 'monthly', labelKey: 'dashboard.orders.monthly' },
  ];

  const currentTimeline: TimelineEntry[] = data?.timeline?.[period] ?? [];
  const timelineChartData = currentTimeline.map((entry) => ({
    label: entry.date || (entry.week ? `W${entry.week}` : '') || entry.month || '',
    orders: entry.orders,
    revenue: entry.revenue,
  }));

  const sr = data?.success_rate;
  const successPieData = sr ? [
    { name: t('dashboard.orders.completed'), value: sr.completed, color: PIE_COLORS[0] },
    { name: t('dashboard.orders.cancelled'), value: sr.cancelled, color: PIE_COLORS[1] },
    { name: t('dashboard.orders.refunded'), value: sr.refunded, color: PIE_COLORS[2] },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.orders.title')}</h3>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[250px] w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-4"><Skeleton className="h-[200px] rounded-lg" /><Skeleton className="h-[200px] rounded-lg" /></div>
        </div>
      ) : data ? (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.orders.timeline')}</h4>
              <div className="flex gap-1">
                {periods.map((p) => (
                  <button key={p.key} onClick={() => setPeriod(p.key)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${period === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >{t(p.labelKey)}</button>
                ))}
              </div>
            </div>
            {timelineChartData.length > 0 ? (
              <div className="h-[220px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={40} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} tickLine={false} axisLine={false} width={60} />
                    <Tooltip content={<LineTooltip />} />
                    <Line yAxisId="left" type="monotone" dataKey="orders" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3, fill: 'var(--chart-1)' }} name={t('dashboard.orders.orders')} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3, fill: 'var(--chart-2)' }} name={t('dashboard.orders.revenue')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.orders.successRate')}</h4>
              {successPieData.length > 0 ? (
                <div className="h-[200px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={successPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {successPieData.map((_, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8}
                        formatter={(value: string) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
              {sr && sr.total > 0 && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  {t('dashboard.orders.total')}: {formatNumber(sr.total)}
                </p>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <h4 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.orders.refundRate')}</h4>
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-4xl font-bold text-foreground tabular-nums">{data.refund_rate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.orders.refundRate')}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">{t('dashboard.errors.noData')}</div>
      )}
    </div>
  );
}
