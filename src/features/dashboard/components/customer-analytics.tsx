import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { Users, UserCheck, Clock } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { getLocalizedName } from '@/shared/lib/localize';
import type { CustomerData } from '../types/dashboard.types';
import { formatCurrency, formatNumber } from '../lib/dashboard-utils';
import { ChartCard, ChartCardError } from './chart-card';

interface CustomerAnalyticsProps {
  data: CustomerData | undefined;
  isLoading: boolean;
  error: Error | null;
}

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-3)'];

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string | number; value: number }>;
}

const PieTooltip = ({ active, payload }: PieTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{payload[0].name}</p>
      <p className="text-sm font-bold text-foreground">{payload[0].value} customers</p>
    </div>
  );
};

interface LineTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ value: number }>;
}

const LineTooltip = ({ active, payload, label }: LineTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">{payload[0].value} new</p>
    </div>
  );
};

export function CustomerAnalytics({ data, isLoading, error }: CustomerAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return <ChartCardError title={t('dashboard.customers.title')} />;
  }

  const newVsReturningData = data ? [
    { name: t('dashboard.customers.newCustomers'), value: data.new_vs_returning.new_customers },
    { name: t('dashboard.customers.returningCustomers'), value: data.new_vs_returning.returning_customers },
  ] : [];

  const activeCards = data ? [
    { label: t('dashboard.customers.last7days'), value: data.active_customers.last_7_days, icon: Clock, color: 'text-info', bg: 'bg-info-soft' },
    { label: t('dashboard.customers.last30days'), value: data.active_customers.last_30_days, icon: UserCheck, color: 'text-success', bg: 'bg-success-soft' },
    { label: t('dashboard.customers.last90days'), value: data.active_customers.last_90_days, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
  ] : [];

  return (
    <ChartCard title={t('dashboard.customers.title')}>
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          <div className="grid grid-cols-2 gap-4"><Skeleton className="h-[200px] rounded-xl" /><Skeleton className="h-[200px] rounded-xl" /></div>
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {activeCards.map((card) => (
              <div key={card.label} className="rounded-xl border bg-muted/40 p-3.5 transition-colors hover:bg-muted/60">
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
                    <card.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <span className="truncate text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{card.label}</span>
                </div>
                <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">{formatNumber(card.value)}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div>
              <h4 className="mb-3 text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.customers.newVsReturning')}</h4>
              {newVsReturningData.some((d) => d.value > 0) ? (
                <div className="h-[200px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={newVsReturningData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {newVsReturningData.map((_, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8}
                        formatter={(value: string) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[150px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
            </div>

            <div>
              <h4 className="mb-3 text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.customers.growth')}</h4>
              {data.monthly_growth.length > 0 ? (
                <div className="h-[200px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthly_growth} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={30} />
                      <Tooltip content={<LineTooltip />} />
                      <Line type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3, fill: 'var(--chart-1)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[150px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.customers.byOrders')}</h4>
              {data.top_customers.by_orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.customers.topCustomers')}</TableHead>
                        <TableHead className="text-end">{t('dashboard.customers.orders')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.top_customers.by_orders.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell><span className="text-sm font-medium text-foreground">{getLocalizedName(c.name, lang)}</span><span className="text-xs text-muted-foreground ms-2">{c.email}</span></TableCell>
                          <TableCell className="text-end tabular-nums font-medium">{c.orders}</TableCell>
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
              <h4 className="mb-3 text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.customers.byRevenue')}</h4>
              {data.top_customers.by_revenue.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.customers.topCustomers')}</TableHead>
                        <TableHead className="text-end">{t('dashboard.customers.revenue')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.top_customers.by_revenue.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell><span className="text-sm font-medium text-foreground">{getLocalizedName(c.name, lang)}</span><span className="text-xs text-muted-foreground ms-2">{c.email}</span></TableCell>
                          <TableCell className="text-end tabular-nums font-medium">{formatCurrency(c.revenue ?? 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
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
