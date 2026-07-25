import { useTranslation } from 'react-i18next';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { getLocalizedName } from '@/shared/lib/localize';
import type { DashboardProductsData } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';

interface ProductAnalyticsProps {
  data: DashboardProductsData | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function ProductAnalytics({ data, isLoading, error }: ProductAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.products.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">{t('dashboard.errors.failedToLoad')}</div>
      </div>
    );
  }

  const nameFn = (item: { name: string | { en: string; ar: string } }) => getLocalizedName(item.name as any, lang);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.products.title')}</h3>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-4"><Skeleton className="h-[200px] rounded-lg" /><Skeleton className="h-[200px] rounded-lg" /></div>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-lg border border-border p-3 col-span-2 sm:col-span-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 p-2.5 text-amber-600 dark:text-amber-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider">{t('dashboard.products.inventoryValue')}</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 tabular-nums">{formatCurrency(data.inventory_value)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-success" />
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.products.bestSelling')}</h4>
              </div>
              {data.best_selling.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.products.product')}</TableHead>
                        <TableHead className="text-end">{t('dashboard.products.price')}</TableHead>
                        <TableHead className="text-end">{t('dashboard.products.sold')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.best_selling.slice(0, 5).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-foreground">{nameFn(p)}</TableCell>
                          <TableCell className="text-end tabular-nums">{formatCurrency(Number(p.price))}</TableCell>
                          <TableCell className="text-end tabular-nums font-medium">{p.sold_quantity}</TableCell>
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
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.products.worstSelling')}</h4>
              </div>
              {data.worst_selling.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.products.product')}</TableHead>
                        <TableHead className="text-end">{t('dashboard.products.price')}</TableHead>
                        <TableHead className="text-end">{t('dashboard.products.sold')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.worst_selling.slice(0, 5).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-foreground">{nameFn(p)}</TableCell>
                          <TableCell className="text-end tabular-nums">{formatCurrency(Number(p.price))}</TableCell>
                          <TableCell className="text-end tabular-nums">{p.sold_quantity}</TableCell>
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

          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.products.neverSold')}</h4>
              </div>
              {data.never_sold.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.products.product')}</TableHead>
                        <TableHead className="text-end">{t('dashboard.products.price')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.never_sold.slice(0, 5).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-foreground">{nameFn(p)}</TableCell>
                          <TableCell className="text-end tabular-nums">{formatCurrency(Number(p.price))}</TableCell>
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
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.products.outOfStock')}</h4>
              </div>
              {data.out_of_stock.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.products.product')}</TableHead>
                        <TableHead className="text-end">{t('dashboard.products.price')}</TableHead>
                        <TableHead className="text-end">{t('dashboard.products.quantity')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.out_of_stock.slice(0, 5).map((p) => (
                        <TableRow key={p.id} className="bg-destructive/5">
                          <TableCell className="font-medium text-foreground">{nameFn(p)}</TableCell>
                          <TableCell className="text-end tabular-nums">{formatCurrency(Number(p.price))}</TableCell>
                          <TableCell className="text-end tabular-nums font-medium text-destructive">0</TableCell>
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
