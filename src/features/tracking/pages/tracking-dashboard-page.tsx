import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button, buttonVariants } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { PageHeader } from '@/shared/components/page-header';
import { DataEmptyState, DataErrorState } from '@/shared/components/data-state';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { useTrackingDashboard, useTrackingAttention } from '../hooks/use-tracking';
import { AttentionAlerts } from '../components/attention-alerts';
import { orderRoutes } from '@/features/orders/routes/order.routes';
import type { TrackingPeriod } from '../types/tracking.types';

const PERIODS: TrackingPeriod[] = ['today', 'week', 'month', 'year'];

export function TrackingDashboardPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<TrackingPeriod>('today');

  const { data, isLoading, isError, refetch } = useTrackingDashboard(period);
  const attention = useTrackingAttention(60_000);

  const dashboard = data?.data;
  const overview = dashboard?.overview;
  const alerts = attention.data?.data.alerts ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('tracking.title')}
        description={t('tracking.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border">
              {PERIODS.map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={period === p ? 'default' : 'ghost'}
                  className="rounded-none"
                  onClick={() => setPeriod(p)}
                >
                  {t(`tracking.periods.${p}`)}
                </Button>
              ))}
            </div>
            <Link
              to={orderRoutes.list}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              {t('orders.title')}
            </Link>
            <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {isError && (
        <DataErrorState message={t('tracking.dashboardError')} onRetry={() => refetch()} />
      )}

      <AttentionAlerts alerts={alerts} />

      {overview && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={ShoppingCart}
              label={t('tracking.overview.totalOrders')}
              value={overview.total_orders}
            />
            <KpiCard
              icon={CheckCircle2}
              label={t('tracking.overview.completedOrders')}
              value={overview.completed_orders}
              tone="text-success"
            />
            <KpiCard
              icon={Clock}
              label={t('tracking.overview.pendingOrders')}
              value={overview.pending_orders}
              tone="text-warning"
              hint={t('tracking.overview.pendingAllTime')}
            />
            <KpiCard
              icon={XCircle}
              label={t('tracking.overview.cancelledOrders')}
              value={overview.cancelled_orders}
              tone="text-destructive"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <section className="rounded-2xl border bg-card p-4 shadow-card lg:col-span-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-muted-foreground" />
                {t('tracking.overview.statusBreakdown')}
              </h3>
              <StatusBreakdown breakdown={dashboard?.status_breakdown ?? {}} />
            </section>

            <section className="rounded-2xl border bg-card p-4 shadow-card">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                {t('tracking.overview.pendingActions')}
              </h3>
              <div className="mt-3 space-y-2">
                <ActionRow
                  label={t('tracking.actions.needsProcessing')}
                  count={dashboard?.pending_actions.needs_processing ?? 0}
                />
                <ActionRow
                  label={t('tracking.actions.needsShipment')}
                  count={dashboard?.pending_actions.needs_shipment ?? 0}
                />
                <ActionRow
                  label={t('tracking.actions.paymentVerification')}
                  count={dashboard?.pending_actions.payment_verification ?? 0}
                />
              </div>
            </section>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <section className="rounded-2xl border bg-card p-4 shadow-card lg:col-span-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                {t('tracking.overview.revenue')}
              </h3>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <div>
                  <p className="text-2xs font-semibold text-muted-foreground uppercase">
                    {t('tracking.revenue.total')}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {(dashboard?.revenue.total ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold text-muted-foreground uppercase">
                    {t('tracking.revenue.average')}
                  </p>
                  <p className="text-xl font-semibold tabular-nums">
                    {(dashboard?.revenue.average ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold text-muted-foreground uppercase">
                    {t('tracking.revenue.paidCount')}
                  </p>
                  <p className="text-xl font-semibold tabular-nums">
                    {dashboard?.revenue.count ?? 0}
                  </p>
                </div>
              </div>
              <CurrencyChips byCurrency={dashboard?.revenue.by_currency ?? {}} mixed={dashboard?.revenue.mixed_currencies ?? false} />
            </section>

            <section className="rounded-2xl border bg-card p-4 shadow-card">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                {t('tracking.overview.totalRevenue')}
              </h3>
              <p className="mt-3 text-3xl font-bold tabular-nums">
                {overview.total_revenue.toLocaleString()}
              </p>
              <CurrencyChips byCurrency={overview.revenue_by_currency} mixed={Object.keys(overview.revenue_by_currency).length > 1} />
            </section>
          </div>

          <section className="rounded-2xl border bg-card shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orders.orderNumber')}</TableHead>
                  <TableHead>{t('orders.customer')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('orders.total')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('orders.createdAt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (dashboard?.recent_orders.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <DataEmptyState className="border-0" />
                    </TableCell>
                  </TableRow>
                ) : (
                  dashboard!.recent_orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          to={orderRoutes.detail(order.id)}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{order.customer}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="tabular-nums">{order.total.toLocaleString()}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {order.created_at}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-2xs font-semibold text-muted-foreground uppercase">{label}</p>
      </div>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${tone ?? ''}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatusBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const { t } = useTranslation();
  const entries = Object.entries(breakdown);
  const max = entries.reduce((acc, [, count]) => Math.max(acc, count), 0);

  if (entries.length === 0) {
    return <DataEmptyState className="mt-3 border-0" />;
  }

  return (
    <div className="mt-3 space-y-2.5">
      {entries.map(([status, count]) => (
        <div key={status} className="flex items-center gap-3">
          <span className="w-24 shrink-0">
            <OrderStatusBadge status={status} />
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${max === 0 ? 0 : Math.max((count / max) * 100, 4)}%` }}
            />
          </div>
          <span className="w-10 text-end font-mono text-sm tabular-nums">{count}</span>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        {t('tracking.overview.rangeScoped')}
      </p>
    </div>
  );
}

function ActionRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background/40 px-3 py-2">
      <span className="flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 text-muted-foreground" />
        {label}
      </span>
      <span className={`font-mono text-sm font-semibold tabular-nums ${count > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
        {count}
      </span>
    </div>
  );
}

export function CurrencyChips({
  byCurrency,
  mixed,
}: {
  byCurrency: Record<string, number>;
  mixed: boolean;
}) {
  const { t } = useTranslation();
  const entries = Object.entries(byCurrency);

  if (entries.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {entries.map(([currency, value]) => (
        <span
          key={currency}
          className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs"
          title={currency === 'UNKNOWN' ? t('tracking.revenue.unknownCurrency') : undefined}
        >
          {value.toLocaleString()} {currency}
        </span>
      ))}
      {mixed && (
        <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs text-warning">
          {t('tracking.revenue.mixed')}
        </span>
      )}
    </div>
  );
}
