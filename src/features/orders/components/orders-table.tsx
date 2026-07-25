import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { OrderStatusBadge } from './order-status-badge';
import { OrderDeleteDialog } from './order-delete-dialog';
import { orderRoutes } from '../routes/order.routes';
import type { OrderListItem } from '../types/order.types';

interface OrdersTableProps {
  data: OrderListItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function OrdersTable({ data, isLoading, onRefresh }: OrdersTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<OrderListItem | null>(null);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('orders.orderNumber')}</TableHead>
              <TableHead>{t('orders.customer')}</TableHead>
              <TableHead>{t('orders.status')}</TableHead>
              <TableHead>{t('orders.paymentStatus')}</TableHead>
              <TableHead>{t('orders.shippingMethod')}</TableHead>
              <TableHead>{t('orders.date')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className="font-medium">{order.order_number}</span>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.customer.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} type="order" />
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.payment_status} type="payment" />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {order.shipping_method}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(orderRoutes.detail(order.id))}
                        >
                          <Eye className="me-2 h-4 w-4" />
                          {t('common.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(order)}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <OrderDeleteDialog
          orderId={deleteTarget.id}
          orderNumber={deleteTarget.order_number}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{'Order'}</TableHead>
            <TableHead>{'Customer'}</TableHead>
            <TableHead>{'Status'}</TableHead>
            <TableHead>{'Payment'}</TableHead>
            <TableHead>{'Shipping'}</TableHead>
            <TableHead>{'Date'}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
