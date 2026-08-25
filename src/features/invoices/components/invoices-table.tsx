import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/shared/ui/table';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { InvoiceStatusBadge } from './invoice-status-badge';
import {
  formatMoney,
  formatDate,
  humanizeStatus,
  getInvoiceCustomerName,
  getInvoiceOrderNumber,
  canDownloadPdf,
} from '../lib/invoice-utils';
import { invoiceRoutes } from '../routes/invoice.routes';
import type { InvoiceListItem } from '../types/invoice.types';

type SortField = 'invoice_number' | 'created_at' | 'total' | 'status';

interface InvoicesTableProps {
  data: InvoiceListItem[];
  isLoading: boolean;
  orderBy: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (field: SortField) => void;
  canDownload?: boolean;
  onDownload?: (invoice: InvoiceListItem) => void;
}

function SortIcon({ field, orderBy, sort }: { field: string; orderBy: string; sort: string }) {
  if (orderBy !== field) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return sort === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3" />
  );
}

export function InvoicesTable({
  data,
  isLoading,
  orderBy,
  sortDir,
  onSortChange,
  canDownload,
  onDownload,
}: InvoicesTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border py-16 text-center">
        <p className="text-sm text-muted-foreground">{t('invoices.empty')}</p>
      </div>
    );
  }

  const sortable = (field: SortField) => onSortChange(field);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer select-none" onClick={() => sortable('invoice_number')}>
              {t('invoices.invoiceNumber')}
              <SortIcon field="invoice_number" orderBy={orderBy} sort={sortDir} />
            </TableHead>
            <TableHead>{t('invoices.orderNumber')}</TableHead>
            <TableHead>{t('invoices.customer')}</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => sortable('status')}>
              {t('invoices.statusColumn')}
              <SortIcon field="status" orderBy={orderBy} sort={sortDir} />
            </TableHead>
            <TableHead className="cursor-pointer select-none text-end" onClick={() => sortable('total')}>
              {t('invoices.total')}
              <SortIcon field="total" orderBy={orderBy} sort={sortDir} />
            </TableHead>
            <TableHead className="text-end">{t('invoices.amountPaid')}</TableHead>
            <TableHead>{t('invoices.paymentMethod')}</TableHead>
            <TableHead>{t('invoices.currency')}</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => sortable('created_at')}>
              {t('invoices.createdAt')}
              <SortIcon field="created_at" orderBy={orderBy} sort={sortDir} />
            </TableHead>
            {canDownload && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((invoice) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer"
              onClick={() => navigate(invoiceRoutes.detail(invoice.id))}
            >
              <TableCell className="font-medium">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{invoice.invoice_number}</code>
              </TableCell>
              <TableCell>
                {getInvoiceOrderNumber(invoice) ? (
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {getInvoiceOrderNumber(invoice)}
                  </code>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="block max-w-[180px] truncate">
                  {getInvoiceCustomerName(invoice) || '—'}
                </span>
                {invoice.customer_email && (
                  <span className="block max-w-[180px] truncate text-xs text-muted-foreground">
                    {invoice.customer_email}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="text-end font-medium">
                {formatMoney(invoice.total, invoice.currency)}
              </TableCell>
              <TableCell className="text-end text-green-600">
                {formatMoney(invoice.amount_paid, invoice.currency)}
              </TableCell>
              <TableCell>
                {invoice.payment_method ? (
                  <span className="text-sm">{humanizeStatus(invoice.payment_method)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>{invoice.currency || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(invoice.created_at)}
              </TableCell>
              {canDownload && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!canDownloadPdf(invoice)}
                    title={t('invoices.downloadPdf')}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload?.(invoice);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('invoices.invoiceNumber')}</TableHead>
            <TableHead>{t('invoices.orderNumber')}</TableHead>
            <TableHead>{t('invoices.customer')}</TableHead>
            <TableHead>{t('invoices.statusColumn')}</TableHead>
            <TableHead className="text-end">{t('invoices.total')}</TableHead>
            <TableHead className="text-end">{t('invoices.amountPaid')}</TableHead>
            <TableHead>{t('invoices.paymentMethod')}</TableHead>
            <TableHead>{t('invoices.currency')}</TableHead>
            <TableHead>{t('invoices.createdAt')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-10" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}