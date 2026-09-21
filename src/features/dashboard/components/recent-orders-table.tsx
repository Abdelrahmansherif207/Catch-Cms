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
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { getLocalizedName } from '@/shared/lib/localize';
import type { RecentOrder } from '../types/dashboard.types';
import { formatCurrency } from '../lib/dashboard-utils';
import { ChartCard, ChartCardError } from './chart-card';

interface RecentOrdersTableProps {
  data: RecentOrder[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function RecentOrdersTable({ data, isLoading, error }: RecentOrdersTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  if (error) {
    return <ChartCardError title={t('dashboard.recentOrders.title')} />;
  }

  return (
    <ChartCard title={t('dashboard.recentOrders.title')}>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-8 w-full rounded-xl" />
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
                    <OrderStatusBadge status={order.status} />
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
        <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          {t('dashboard.errors.noData')}
        </div>
      )}
    </ChartCard>
  );
}
