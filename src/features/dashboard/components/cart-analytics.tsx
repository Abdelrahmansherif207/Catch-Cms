import { useTranslation } from 'react-i18next';
import { ShoppingCart, DollarSign, TrendingDown, Package } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { getLocalizedName } from '@/shared/lib/localize';
import type { DashboardCartData } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';
import { ChartCard, ChartCardError } from './chart-card';

interface CartAnalyticsProps {
  data: DashboardCartData | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function CartAnalytics({ data, isLoading, error }: CartAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return <ChartCardError title={t('dashboard.cart.title')} />;
  }

  const kpiCards = data ? [
    { label: t('dashboard.cart.abandonmentRate'), value: `${data.abandonment_rate.toFixed(1)}%`, icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive-soft', alert: data.abandonment_rate > 50 },
    { label: t('dashboard.cart.avgCartValue'), value: formatCurrency(data.average_cart_value), icon: DollarSign, color: 'text-success', bg: 'bg-success-soft', alert: false },
    { label: t('dashboard.cart.checkoutDropoff'), value: `${data.checkout_dropoff_rate.toFixed(1)}%`, icon: ShoppingCart, color: 'text-warning', bg: 'bg-warning-soft', alert: data.checkout_dropoff_rate > 50 },
  ] : [];

  return (
    <ChartCard title={t('dashboard.cart.title')}>
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {kpiCards.map((card) => (
              <div key={card.label} className={`rounded-xl border p-3.5 transition-colors hover:bg-muted/60 ${card.alert ? 'border-destructive/30 bg-destructive-soft' : 'bg-muted/40'}`}>
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
                    <card.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <span className="truncate text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{card.label}</span>
                </div>
                <p className={`text-xl font-bold tracking-tight tabular-nums ${card.alert ? 'text-destructive' : 'text-foreground'}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-2xs font-semibold tracking-wider text-muted-foreground uppercase">{t('dashboard.cart.mostAdded')}</h4>
            </div>
            {data.most_added_products.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.cart.product')}</TableHead>
                      <TableHead className="text-end">{t('dashboard.cart.price')}</TableHead>
                      <TableHead className="text-end">{t('dashboard.cart.timesAdded')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.most_added_products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-foreground">{getLocalizedName(p.name, lang)}</TableCell>
                        <TableCell className="text-end tabular-nums">{formatCurrency(p.price)}</TableCell>
                        <TableCell className="text-end tabular-nums font-medium">{p.total_added}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">{t('dashboard.errors.noData')}</div>
      )}
    </ChartCard>
  );
}
