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

interface CustomerAnalyticsProps {
  data: CustomerData | undefined;
  isLoading: boolean;
  error: Error | null;
}

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-3)'];

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{payload[0].name}</p>
      <p className="text-sm font-bold text-foreground">{payload[0].value} customers</p>
    </div>
  );
};

const LineTooltip = ({ active, payload, label }: any) => {
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
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.customers.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">{t('dashboard.errors.failedToLoad')}</div>
      </div>
    );
  }

  const newVsReturningData = data ? [
    { name: t('dashboard.customers.newCustomers'), value: data.new_vs_returning.new_customers },
    { name: t('dashboard.customers.returningCustomers'), value: data.new_vs_returning.returning_customers },
  ] : [];

  const activeCards = data ? [
    { label: t('dashboard.customers.last7days'), value: data.active_customers.last_7_days, icon: Clock },
    { label: t('dashboard.customers.last30days'), value: data.active_customers.last_30_days, icon: UserCheck },
    { label: t('dashboard.customers.last90days'), value: data.active_customers.last_90_days, icon: Users },
  ] : [];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.customers.title')}</h3>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          <div className="grid grid-cols-2 gap-4"><Skeleton className="h-[200px] rounded-lg" /><Skeleton className="h-[200px] rounded-lg" /></div>
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {activeCards.map((card) => (
              <div key={card.label} className="rounded-lg border border-border p-3 text-center">
                <card.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold text-foreground tabular-nums">{formatNumber(card.value)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div>
              <h4 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.customers.newVsReturning')}</h4>
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
                <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
            </div>

            <div>
              <h4 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.customers.growth')}</h4>
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
                <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.customers.byOrders')}</h4>
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
                          <TableCell><span className="text-sm font-medium text-foreground">{getLocalizedName(c.name, lang)}</span><span className="text-xs text-muted-foreground ml-2">{c.email}</span></TableCell>
                          <TableCell className="text-end tabular-nums font-medium">{c.orders}</TableCell>
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
              <h4 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.customers.byRevenue')}</h4>
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
                          <TableCell><span className="text-sm font-medium text-foreground">{getLocalizedName(c.name, lang)}</span><span className="text-xs text-muted-foreground ml-2">{c.email}</span></TableCell>
                          <TableCell className="text-end tabular-nums font-medium">{formatCurrency(c.revenue ?? 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
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
