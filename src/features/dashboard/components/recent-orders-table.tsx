import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { getLocalizedName } from '@/shared/lib/localize';
import type { RecentOrder } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';

interface RecentOrdersTableProps {
  data: RecentOrder[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'> = {
  pending: 'outline',
  processing: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
  refunded: 'ghost',
  failed: 'destructive',
  delivered: 'default',
  local_facility: 'secondary',
  out_for_delivery: 'secondary',
};

export function RecentOrdersTable({ data, isLoading, error }: RecentOrdersTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('dashboard.recentOrders.title')}</h3>
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
          {t('dashboard.errors.failedToLoad')}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        {t('dashboard.recentOrders.title')}
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ) : data && data.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t('dashboard.recentOrders.orderId')}</TableHead>
                <TableHead>{t('dashboard.recentOrders.customer')}</TableHead>
                <TableHead>{t('dashboard.recentOrders.status')}</TableHead>
                <TableHead className="text-end">{t('dashboard.recentOrders.total')}</TableHead>
                <TableHead>{t('dashboard.recentOrders.products')}</TableHead>
                <TableHead className="text-end">{t('dashboard.recentOrders.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    #{order.id}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">{getLocalizedName(order.user?.name, lang) || '—'}</div>
                    <div className="text-xs text-muted-foreground">{order.user?.email ?? ''}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANTS[order.status] ?? 'outline'}
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end font-medium tabular-nums">
                    {formatCurrency(order.total_price)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {order.products?.length ?? 0} {t('dashboard.recentOrders.items')}
                    </span>
                  </TableCell>
                  <TableCell className="text-end text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          {t('dashboard.errors.noData')}
        </div>
      )}
    </div>
  );
}
