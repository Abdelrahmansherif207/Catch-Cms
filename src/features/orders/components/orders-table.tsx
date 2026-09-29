import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MoreHorizontal, Eye, Trash2, Layers } from 'lucide-react';
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
import { Checkbox } from '@/shared/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { DataEmptyState } from '@/shared/components/data-state';
import { cn } from '@/shared/lib/utils';
import { OrderStatusBadge } from './order-status-badge';
import { OrderDeleteDialog } from './order-delete-dialog';
import { BulkStatusDialog } from './bulk-status-dialog';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
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
  const { can } = usePermissions();
  const [deleteTarget, setDeleteTarget] = useState<OrderListItem | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const selectedCount = selected.size;

  const canUpdateStatus = can(PERMISSIONS.orders.updateStatus);
  const allSelected = data.length > 0 && data.every((o) => selected.has(o.id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(data.map((o) => o.id)));
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      {selectedCount > 0 && canUpdateStatus && (
        <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 shadow-card">
          <span className="text-sm text-muted-foreground">
            {t('orders.selectedCount', { count: selectedCount })}
          </span>
          <Button size="sm" onClick={() => setBulkOpen(true)}>
            <Layers className="me-2 h-4 w-4" />
            {t('orders.bulkStatus')}
          </Button>
        </div>
      )}
      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {canUpdateStatus && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label={t('orders.selectAll')}
                  />
                </TableHead>
              )}
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
                <TableCell colSpan={canUpdateStatus ? 8 : 7}>
                  <DataEmptyState title={t('common.noData')} className="border-0" />
                </TableCell>
              </TableRow>
            ) : (
              data.map((order) => (
                <TableRow
                  key={order.id}
                  className={cn(
                    'transition-colors',
                    selected.has(order.id) &&
                      'bg-primary/10 shadow-[inset_2px_0_0_0_var(--primary)]'
                  )}
                >
                  {canUpdateStatus && (
                    <TableCell>
                      <Checkbox
                        checked={selected.has(order.id)}
                        onCheckedChange={() => toggleOne(order.id)}
                        aria-label={t('orders.selectRow', { id: order.id })}
                      />
                    </TableCell>
                  )}
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

      {bulkOpen && canUpdateStatus && (
        <BulkStatusDialog
          orderIds={[...selected]}
          open={bulkOpen}
          onOpenChange={(open) => {
            if (!open) {
              setBulkOpen(false);
              setSelected(new Set());
              onRefresh();
            }
          }}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
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
