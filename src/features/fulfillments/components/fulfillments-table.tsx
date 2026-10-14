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
}

export function FulfillmentsTable({ data, isLoading }: FulfillmentsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={7}>
                <DataEmptyState className="border-0" />
              </TableCell>
            </TableRow>
          ) : (
            data.map((fulfillment) => (
              <TableRow key={fulfillment.id}>
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
