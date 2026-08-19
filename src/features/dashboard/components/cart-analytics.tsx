import { useTranslation } from 'react-i18next';
import { ShoppingCart, DollarSign, TrendingDown, Package } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { getLocalizedName } from '@/shared/lib/localize';
import type { DashboardCartData } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';

interface CartAnalyticsProps {
  data: DashboardCartData | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function CartAnalytics({ data, isLoading, error }: CartAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.cart.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">{t('dashboard.errors.failedToLoad')}</div>
      </div>
    );
  }

  const kpiCards = data ? [
    { label: t('dashboard.cart.abandonmentRate'), value: `${data.abandonment_rate.toFixed(1)}%`, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', alert: data.abandonment_rate > 50 },
    { label: t('dashboard.cart.avgCartValue'), value: formatCurrency(data.average_cart_value), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', alert: false },
    { label: t('dashboard.cart.checkoutDropoff'), value: `${data.checkout_dropoff_rate.toFixed(1)}%`, icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', alert: data.checkout_dropoff_rate > 50 },
  ] : [];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.cart.title')}</h3>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {kpiCards.map((card) => (
              <div key={card.label} className={`rounded-lg border p-4 ${card.alert ? 'border-rose-200 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-950/10' : 'border-border'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`rounded-md p-1.5 ${card.bg} ${card.color}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{card.label}</span>
                </div>
                <p className={`text-xl font-bold tabular-nums ${card.alert ? 'text-destructive' : 'text-foreground'}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.cart.mostAdded')}</h4>
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
              <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t('dashboard.errors.noData')}</div>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">{t('dashboard.errors.noData')}</div>
      )}
    </div>
  );
}
