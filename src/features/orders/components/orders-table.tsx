import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MoreHorizontal, Eye, Trash2, Layers, PackageCheck, X } from 'lucide-react';
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
import { SelectCheckbox } from '@/shared/components/select-checkbox';
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
import { FulfillmentStatusBadge } from './fulfillment-status-badge';
import { OrderDeleteDialog } from './order-delete-dialog';
import { BulkStatusDialog } from './bulk-status-dialog';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { orderRoutes } from '../routes/order.routes';
import { useReleaseSelection, RELEASE_SELECTION_MAX } from '../hooks/use-release-selection';
import { ReleaseFulfillmentDialog } from '@/features/fulfillments/components/release-fulfillment-dialog';
import { stalenessAccent } from '@/features/tracking/utils/order-colors';
import type { TrackingOrderRow } from '@/features/tracking/types/tracking.types';

interface OrdersTableProps {
  data: TrackingOrderRow[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function OrdersTable({ data, isLoading, onRefresh }: OrdersTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [deleteTarget, setDeleteTarget] = useState<TrackingOrderRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);

  // Persistent selection basket (localStorage) — survives refreshes and
  // connectivity loss so an operator can stage a release batch over time.
  const {
    selected,
    isSelected,
    toggle,
    toggleMany,
    clearSelected,
    clearAll,
  } = useReleaseSelection();

  const canUpdateStatus = can(PERMISSIONS.orders.updateStatus);
  const canRelease = can(PERMISSIONS.fulfillments.release);
  const showCheckbox = canUpdateStatus || canRelease;
  const selectedCount = selected.size;

  const pageSelected = data.filter((o) => isSelected(o.id));
  const allSelected = data.length > 0 && pageSelected.length === data.length;

  const toggleAll = () => {
    if (allSelected) {
      // Un-ticking the header clears ONLY the current page — ids on other
      // pages are kept in the basket.
      clearSelected(data.map((o) => o.id));
    } else {
      toggleMany(data.map((o) => o.id));
    }
  };

  const toggleOne = (id: number) => {
    toggle(id);
  };

  const clearBasket = () => {
    clearAll();
  };

  if (isLoading) {
    return <TableSkeleton showCheckbox={showCheckbox} />;
  }

  return (
    <>
      {selectedCount > 0 && (canUpdateStatus || canRelease) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card px-4 py-3 shadow-card">
          <span className="text-sm text-muted-foreground">
            {t('orders.selectedCount', { count: selectedCount })}
            {selectedCount >= RELEASE_SELECTION_MAX && (
              <span className="ms-1 text-xs text-warning">
                {t('fulfillments.releaseCap', { max: RELEASE_SELECTION_MAX })}
              </span>
            )}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            {canRelease && (
              <Button size="sm" onClick={() => setReleaseOpen(true)}>
                <PackageCheck className="me-2 h-4 w-4" />
                {t('fulfillments.releaseAction')}
              </Button>
            )}
            {canUpdateStatus && (
              <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
                <Layers className="me-2 h-4 w-4" />
                {t('orders.bulkStatus')}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={clearBasket}>
              <X className="me-1 h-4 w-4" />
              {t('common.clear')}
            </Button>
          </span>
        </div>
      )}
      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckbox && (
                <TableHead className="w-10">
                  <SelectCheckbox
                    checked={allSelected}
                    indeterminate={!allSelected && pageSelected.length > 0}
                    onCheckedChange={toggleAll}
                    ariaLabel={t('orders.selectAll')}
                  />
                </TableHead>
              )}
              <TableHead>{'#'}</TableHead>
              <TableHead>{t('orders.orderNumber')}</TableHead>
              <TableHead>{t('orders.customer')}</TableHead>
              <TableHead>{t('orders.status')}</TableHead>
              <TableHead>{t('orders.paymentStatus')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('orders.fulfillment')}</TableHead>
              <TableHead>{t('orders.total')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('orders.createdAt')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showCheckbox ? 10 : 9}>
                  <DataEmptyState title={t('common.noData')} className="border-0" />
                </TableCell>
              </TableRow>
            ) : (
              data.map((order) => (
                <TableRow
                  key={order.id}
                  className={cn(
                    'transition-colors',
                    stalenessAccent(order),
                    selected.has(order.id) && 'bg-primary/10'
                  )}
                >
                  {showCheckbox && (
                    <TableCell>
                      <SelectCheckbox
                        checked={selected.has(order.id)}
                        onCheckedChange={() => toggleOne(order.id)}
                        ariaLabel={t('orders.selectRow', { id: order.id })}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-xs">{order.id}</TableCell>
                  <TableCell>
                    <span className="font-medium font-mono text-sm">{order.order_number}</span>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {order.user?.name ?? order.name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.user?.email ?? order.user_email ?? '—'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} type="order" />
                  </TableCell>
                  <TableCell>
                    {order.payment_status ? (
                      <OrderStatusBadge status={order.payment_status} type="payment" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order.fulfillment_status ? (
                      <FulfillmentStatusBadge status={order.fulfillment_status} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {order.total_price.toLocaleString()}{' '}
                    <span className="text-xs text-muted-foreground">
                      {order.currency_code ?? ''}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground whitespace-nowrap sm:table-cell">
                    {new Date(order.created_at).toLocaleDateString()}
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
                        {!selected.has(order.id) && canRelease && (
                          <DropdownMenuItem onClick={() => toggleOne(order.id)}>
                            <PackageCheck className="me-2 h-4 w-4" />
                            {t('fulfillments.addRowToRelease')}
                          </DropdownMenuItem>
                        )}
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
              clearAll();
              onRefresh();
            }
          }}
        />
      )}

      {canRelease && (
        <ReleaseFulfillmentDialog
          orderIds={[...selected]}
          open={releaseOpen}
          onOpenChange={setReleaseOpen}
          onReleased={(releasedOrderIds) => {
            // Selected orders that produced a fulfillment leave the basket;
            // refused ones stay so the operator can retry after fixing.
            clearSelected(releasedOrderIds);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

function TableSkeleton({ showCheckbox }: { showCheckbox: boolean }) {
  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckbox && <TableHead className="w-10" />}
            <TableHead>{'Order'}</TableHead>
            <TableHead>{'Customer'}</TableHead>
            <TableHead>{'Status'}</TableHead>
            <TableHead>{'Payment'}</TableHead>
            <TableHead className="hidden md:table-cell">{'Fulfillment'}</TableHead>
            <TableHead>{'Total'}</TableHead>
            <TableHead className="hidden sm:table-cell">{'Date'}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {showCheckbox && <TableCell />}
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
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
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
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
