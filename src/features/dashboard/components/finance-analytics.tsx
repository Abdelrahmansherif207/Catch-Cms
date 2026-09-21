import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DollarSign, PiggyBank, RotateCcw, Percent, Truck } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import type { DashboardFinanceData } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';
import { ChartCard, ChartCardError } from './chart-card';

interface FinanceAnalyticsProps {
  data: DashboardFinanceData | undefined;
  isLoading: boolean;
  error: Error | null;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ value: number }>;
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export function FinanceAnalytics({ data, isLoading, error }: FinanceAnalyticsProps) {
  const { t } = useTranslation();

  if (error) {
    return <ChartCardError title={t('dashboard.finance.title')} />;
  }

  const cards = data ? [
    { label: t('dashboard.finance.grossRevenue'), value: data.gross_revenue, icon: DollarSign, color: 'text-info', bg: 'bg-info-soft' },
    { label: t('dashboard.finance.netRevenue'), value: data.net_revenue, icon: PiggyBank, color: 'text-success', bg: 'bg-success-soft' },
    { label: t('dashboard.finance.refundAmount'), value: data.refund_amount, icon: RotateCcw, color: 'text-destructive', bg: 'bg-destructive-soft' },
    { label: t('dashboard.finance.totalDiscount'), value: data.total_discount, icon: Percent, color: 'text-warning', bg: 'bg-warning-soft' },
    { label: t('dashboard.finance.shippingRevenue'), value: data.shipping_revenue, icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
  ] : [];

  const breakdownData = data ? [
    { name: t('dashboard.finance.grossRevenue'), value: data.gross_revenue },
    { name: t('dashboard.finance.netRevenue'), value: data.net_revenue },
    { name: t('dashboard.finance.refundAmount'), value: data.refund_amount },
    { name: t('dashboard.finance.totalDiscount'), value: data.total_discount },
    { name: t('dashboard.finance.shippingRevenue'), value: data.shipping_revenue },
  ].filter((d) => d.value > 0) : [];

  return (
    <ChartCard title={t('dashboard.finance.title')}>
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-[220px] rounded-xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl border bg-muted/40 p-3.5 transition-colors hover:bg-muted/60">
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
                    <card.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <span className="truncate text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{card.label}</span>
                </div>
                <p className={`text-xl font-bold tracking-tight tabular-nums ${card.label === t('dashboard.finance.refundAmount') || card.label === t('dashboard.finance.totalDiscount') ? 'text-destructive' : 'text-foreground'}`}>
                  {formatCurrency(card.value)}
                </p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="mb-3 text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.finance.revenueBreakdown')}</h4>
            {breakdownData.length > 0 ? (
              <div className="h-[250px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={120} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {breakdownData.map((_, i) => {
                        const colors = ['var(--chart-1)', 'var(--chart-4)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)'];
                        return <Cell key={i} fill={colors[i % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">{t('dashboard.errors.noData')}</div>
      )}
    </ChartCard>
  );
}
