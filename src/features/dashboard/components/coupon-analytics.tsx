import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TicketPercent } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { getLocalizedName } from '@/shared/lib/localize';
import type { DashboardCouponsData } from '../types/dashboard.types';
import { formatCurrency, formatNumber } from '../lib/dashboard-utils';
import { ChartCard, ChartCardError } from './chart-card';

interface CouponAnalyticsProps {
  data: DashboardCouponsData | undefined;
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

export function CouponAnalytics({ data, isLoading, error }: CouponAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return <ChartCardError title={t('dashboard.coupons.title')} />;
  }

  return (
    <ChartCard title={t('dashboard.coupons.title')}>
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></div>
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      ) : data ? (
        <>
          <div className="mb-6">
            <div className="rounded-xl border bg-muted/40 p-3.5 transition-colors hover:bg-muted/60">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info-soft text-info">
                  <TicketPercent className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
                <span className="truncate text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.coupons.totalUsage')}</span>
              </div>
              <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">{formatNumber(data.total_usage)}</p>
            </div>

          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.coupons.topCoupons')}</h4>
              {data.top_coupons.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.coupons.code')}</TableHead>
                        <TableHead>{t('dashboard.coupons.name')}</TableHead>
                        <TableHead className="text-end">{t('dashboard.coupons.usageCount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.top_coupons.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-xs font-medium text-foreground">{c.code}</TableCell>
                          <TableCell className="text-sm text-foreground">{getLocalizedName(c.name, lang)}</TableCell>
                          <TableCell className="text-end tabular-nums font-medium">{formatNumber(c.usage_count)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
            </div>

            <div>
              <h4 className="mb-3 text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.coupons.revenueByCoupon')}</h4>
              {data.revenue_by_coupon.length > 0 ? (
                <div className="h-[220px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenue_by_coupon} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v: number) => formatCurrency(v)} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="code" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={80} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="revenue" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[150px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">{t('dashboard.errors.noData')}</div>
      )}
    </ChartCard>
  );
}
