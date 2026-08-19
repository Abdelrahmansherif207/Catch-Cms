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

interface FinanceAnalyticsProps {
  data: DashboardFinanceData | undefined;
  isLoading: boolean;
  error: Error | null;
}

const ChartTooltip = ({ active, payload, label }: any) => {
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
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.finance.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">{t('dashboard.errors.failedToLoad')}</div>
      </div>
    );
  }

  const cards = data ? [
    { label: t('dashboard.finance.grossRevenue'), value: data.gross_revenue, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: t('dashboard.finance.netRevenue'), value: data.net_revenue, icon: PiggyBank, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: t('dashboard.finance.refundAmount'), value: data.refund_amount, icon: RotateCcw, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
    { label: t('dashboard.finance.totalDiscount'), value: data.total_discount, icon: Percent, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: t('dashboard.finance.shippingRevenue'), value: data.shipping_revenue, icon: Truck, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30' },
  ] : [];

  const breakdownData = data ? [
    { name: t('dashboard.finance.grossRevenue'), value: data.gross_revenue },
    { name: t('dashboard.finance.netRevenue'), value: data.net_revenue },
    { name: t('dashboard.finance.refundAmount'), value: data.refund_amount },
    { name: t('dashboard.finance.totalDiscount'), value: data.total_discount },
    { name: t('dashboard.finance.shippingRevenue'), value: data.shipping_revenue },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.finance.title')}</h3>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          <Skeleton className="h-[220px] rounded-lg" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {cards.map((card) => (
              <div key={card.label} className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`rounded-md p-1.5 ${card.bg} ${card.color}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{card.label}</span>
                </div>
                <p className={`text-lg font-bold tabular-nums ${card.label === t('dashboard.finance.refundAmount') || card.label === t('dashboard.finance.totalDiscount') ? 'text-destructive' : 'text-foreground'}`}>
                  {formatCurrency(card.value)}
                </p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.finance.revenueBreakdown')}</h4>
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
              <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">{t('dashboard.errors.noData')}</div>
      )}
    </div>
  );
}
