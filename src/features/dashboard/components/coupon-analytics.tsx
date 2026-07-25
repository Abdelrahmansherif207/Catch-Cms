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
import { TicketPercent, DollarSign } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { getLocalizedName } from '@/shared/lib/localize';
import type { DashboardCouponsData } from '../types/dashboard.types';
import { formatCurrency, formatNumber } from '../lib/dashboard-utils';

interface CouponAnalyticsProps {
  data: DashboardCouponsData | undefined;
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

export function CouponAnalytics({ data, isLoading, error }: CouponAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.coupons.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">{t('dashboard.errors.failedToLoad')}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.coupons.title')}</h3>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3"><Skeleton className="h-20 rounded-lg" /><Skeleton className="h-20 rounded-lg" /></div>
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-md p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <TicketPercent className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">{t('dashboard.coupons.totalUsage')}</span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{formatNumber(data.total_usage)}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <DollarSign className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">{t('dashboard.coupons.totalDiscount')}</span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(data.total_discount)}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.coupons.topCoupons')}</h4>
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
                <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
            </div>

            <div>
              <h4 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.coupons.revenueByCoupon')}</h4>
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
                <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">{t('dashboard.errors.noData')}</div>
      )}
    </div>
  );
}
