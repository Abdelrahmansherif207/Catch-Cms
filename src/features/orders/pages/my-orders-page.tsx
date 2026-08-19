import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft, FileText, Package } from 'lucide-react';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useMyOrders } from '../hooks/use-orders';
import { OrderStatusBadge } from '../components/order-status-badge';
import { orderRoutes } from '../routes/order.routes';
import type { MyOrderListItem } from '../types/order.types';

function invoiceUuid(order: MyOrderListItem): string | null {
  if (order.invoice_uuid) return order.invoice_uuid;
  if (order.invoice_id === null || order.invoice_id === undefined) return null;
  return String(order.invoice_id);
}

export function MyOrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useMyOrders(page, 15);
  const orders = data?.data?.data ?? [];
  const links = data?.data?.links;

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate('/')}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{t('orders.myOrders.title')}</h1>
          <p className="text-muted-foreground">{t('orders.myOrders.subtitle')}</p>
        </div>

        {isError && (
          <div className="mb-4 flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{t('orders.myOrders.listError')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border bg-card">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('orders.myOrders.empty')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orders.orderNumber')}</TableHead>
                  <TableHead>{t('orders.status')}</TableHead>
                  <TableHead className="text-end">{t('orders.total')}</TableHead>
                  <TableHead>{t('orders.date')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const uuid = invoiceUuid(order);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {order.order_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} type="order" />
                      </TableCell>
                      <TableCell className="text-end font-medium">
                        {formatTotal(order, t('orders.currency'))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-end">
                        {order.order_has_invoice && uuid ? (
                          <Link
                            to={orderRoutes.myOrderInvoice(uuid)}
                            className={buttonVariants({ variant: 'outline', size: 'sm' })}
                          >
                            <FileText className="me-2 h-4 w-4" />
                            {t('orders.viewInvoice')}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t('orders.noInvoice')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {links && links.last_page > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {t('common.showing')} {links.from} {t('common.to')} {links.to} {t('common.of')}{' '}
              {links.total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ←
              </Button>
              <span className="px-2 text-muted-foreground">
                {t('common.page')} {page} {t('common.of')} {links.last_page}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= links.last_page}
                onClick={() => setPage(page + 1)}
              >
                →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTotal(order: MyOrderListItem, currency: string): string {
  const value = order.total_price ?? order.total ?? order.price ?? 0;
  return `${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}