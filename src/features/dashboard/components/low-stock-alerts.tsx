import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { getLocalizedName } from '@/shared/lib/localize';
import type { LowStockProduct } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';
import { ChartCard, ChartCardError } from './chart-card';

interface LowStockAlertsProps {
  data: LowStockProduct[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function LowStockAlerts({ data, isLoading, error }: LowStockAlertsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return <ChartCardError title={t('dashboard.lowStock.title')} />;
  }

  return (
    <ChartCard title={t('dashboard.lowStock.title')}>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((product) => {
            const isCritical = product.quantity <= 3;
            return (
              <div
                key={product.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isCritical
                    ? 'border-destructive/30 bg-destructive-soft'
                    : 'border-warning/30 bg-warning-soft'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isCritical
                      ? 'bg-destructive-soft text-destructive'
                      : 'bg-warning-soft text-warning'
                  }`}
                >
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getLocalizedName(product.name, lang)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getLocalizedName(product.type?.name, lang)} &middot; {formatCurrency(product.price)}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p
                    className={`text-sm font-bold tabular-nums ${
                      isCritical ? 'text-destructive' : 'text-warning'
                    }`}
                  >
                    {product.quantity}
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    {t('dashboard.lowStock.remaining')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          {t('dashboard.errors.noData')}
        </div>
      )}
    </ChartCard>
  );
}
