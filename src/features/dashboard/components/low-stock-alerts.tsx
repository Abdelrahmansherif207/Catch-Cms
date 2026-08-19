import { useTranslation } from 'react-i18next';
import { AlertTriangle, Package } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { getLocalizedName } from '@/shared/lib/localize';
import type { LowStockProduct } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';

interface LowStockAlertsProps {
  data: LowStockProduct[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function LowStockAlerts({ data, isLoading, error }: LowStockAlertsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.lowStock.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
          {t('dashboard.errors.failedToLoad')}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-foreground">
          {t('dashboard.lowStock.title')}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
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
                    ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isCritical
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
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
                      isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {product.quantity}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t('dashboard.lowStock.remaining')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          {t('dashboard.errors.noData')}
        </div>
      )}
    </div>
  );
}
