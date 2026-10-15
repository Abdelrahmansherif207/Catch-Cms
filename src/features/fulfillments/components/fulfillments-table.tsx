import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Eye, MoreHorizontal, PackagePlus } from 'lucide-react';
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
import { Skeleton } from '@/shared/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { DataEmptyState } from '@/shared/components/data-state';
import { FulfillmentStatusBadge } from './fulfillment-status-badge';
import { fulfillmentRoutes } from '../routes/fulfillment.routes';
import { orderRoutes } from '@/features/orders/routes/order.routes';
import type { FulfillmentListItem } from '../types/fulfillment.types';

interface FulfillmentsTableProps {
  data: FulfillmentListItem[];
  isLoading: boolean;
  /** Bulk-actions selection — render only when provided (back-compatible). */
  selectedIds?: Set<number>;
  onToggle?: (id: number) => void;
  /**
   * Receives the ELIGIBLE rows only (see eligibleStatus) — the caller never
   * sees an ineligible id staged.
   */
  onToggleAll?: (eligibleRows: FulfillmentListItem[], checked: boolean) => void;
  /** Active bulk mode's status — rows of other statuses render disabled. */
  eligibleStatus?: string | null;
}

export function FulfillmentsTable({
  data,
  isLoading,
  selectedIds,
  onToggle,
  onToggleAll,
  eligibleStatus,
}: FulfillmentsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selectable = selectedIds !== undefined && onToggle !== undefined && onToggleAll !== undefined;
  const isEligible = (row: FulfillmentListItem) =>
    eligibleStatus === undefined || eligibleStatus === null || row.status === eligibleStatus;
  const eligibleRows = data.filter(isEligible);
  const allSelected =
    selectable && eligibleRows.length > 0 && eligibleRows.every((row) => selectedIds.has(row.id));
  const someSelected = selectable && eligibleRows.some((row) => selectedIds.has(row.id));

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <SelectCheckbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onCheckedChange={(checked) => onToggleAll(eligibleRows, checked)}
                  ariaLabel={t('common.selectAll')}
                />
              </TableHead>
            )}
            <TableHead>{t('fulfillments.number')}</TableHead>
            <TableHead>{t('fulfillments.order')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('fulfillments.items')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('fulfillments.shipments')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('fulfillments.createdAt')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={selectable ? 8 : 7}>
                <DataEmptyState className="border-0" />
              </TableCell>
            </TableRow>
          ) : (
            data.map((fulfillment) => (
              <TableRow
                key={fulfillment.id}
                className={
                  selectable && selectedIds.has(fulfillment.id)
                    ? 'bg-primary/10 shadow-[inset_2px_0_0_0_var(--primary)]'
                    : undefined
                }
              >
                {selectable && (
                  <TableCell
                    onClick={(event) => event.stopPropagation()}
                  >
                    <SelectCheckbox
                      checked={selectedIds.has(fulfillment.id)}
                      onCheckedChange={() => onToggle(fulfillment.id)}
                      disabled={!isEligible(fulfillment)}
                      ariaLabel={fulfillment.fulfillment_number}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => navigate(fulfillmentRoutes.detail(fulfillment.id))}
                    className="font-mono text-sm font-medium hover:underline"
                  >
                    {fulfillment.fulfillment_number}
                  </button>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => navigate(orderRoutes.detail(fulfillment.order_id))}
                    className="font-medium hover:underline"
                  >
                    #{fulfillment.order_id}
                  </button>
                </TableCell>
                <TableCell>
                  <FulfillmentStatusBadge status={fulfillment.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">
                  {fulfillment.items_count}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {fulfillment.shipments_count}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {new Date(fulfillment.created_at).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(fulfillmentRoutes.detail(fulfillment.id))}
                      >
                        <Eye className="me-2 h-4 w-4" />
                        {t('common.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(orderRoutes.detail(fulfillment.order_id))}
                      >
                        <PackagePlus className="me-2 h-4 w-4" />
                        {t('fulfillments.viewOrder')}
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
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>FF</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Items</TableHead>
            <TableHead className="hidden md:table-cell">Shipments</TableHead>
            <TableHead className="hidden sm:table-cell">Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
