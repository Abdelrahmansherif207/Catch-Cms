import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, QrCode, Receipt } from 'lucide-react';
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
import { useMyInvoices, useInvoiceDownload } from '../hooks/use-invoices';
import { InvoiceStatusBadge } from '../components/invoice-status-badge';
import { formatMoney, formatDate } from '../lib/invoice-utils';
import { invoiceRoutes } from '../routes/invoice.routes';
import type { InvoiceListItem } from '../types/invoice.types';

export function MyInvoicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { download } = useInvoiceDownload();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMyInvoices(page, 15);
  const invoices = data?.data?.data ?? [];
  const links = data?.data?.links;

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate('/')}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{t('invoices.myInvoices.title')}</h1>
          <p className="text-muted-foreground">{t('invoices.myInvoices.subtitle')}</p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('invoices.myInvoices.empty')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoices.invoiceNumber')}</TableHead>
                  <TableHead>{t('invoices.status')}</TableHead>
                  <TableHead className="text-end">{t('invoices.total')}</TableHead>
                  <TableHead>{t('invoices.createdAt')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: InvoiceListItem) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer"
                    onClick={() => navigate(invoiceRoutes.myInvoice(invoice.uuid))}
                  >
                    <TableCell className="font-medium">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {invoice.invoice_number}
                      </code>
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-end font-medium">
                      {formatMoney(invoice.total, invoice.currency)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invoice.created_at)}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={!invoice.pdf_ready}
                          title={t('invoices.downloadPdf')}
                          onClick={(e) => {
                            e.stopPropagation();
                            download(invoice.uuid);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Link
                          to={invoiceRoutes.verify(invoice.uuid)}
                          title={t('invoices.actions.verify')}
                          onClick={(e) => e.stopPropagation()}
                          className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                        >
                          <QrCode className="h-4 w-4" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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