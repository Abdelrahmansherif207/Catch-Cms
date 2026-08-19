import { useParams, useNavigate, Link } from 'react-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, FileMinus, FileText, QrCode, ShoppingCart } from 'lucide-react';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Separator } from '@/shared/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useMyInvoice, useInvoiceDownload } from '../hooks/use-invoices';
import { InvoiceStatusBadge } from '../components/invoice-status-badge';
import { formatMoney, formatDate } from '../lib/invoice-utils';
import { invoiceRoutes } from '../routes/invoice.routes';

export function MyInvoiceDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { download, isDownloading } = useInvoiceDownload();

  const { data, isLoading } = useMyInvoice(uuid);
  const invoice = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-8">
        <div className="mx-auto w-full max-w-3xl py-20 text-center">
          <p className="text-muted-foreground">{t('invoices.notFound')}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(invoiceRoutes.myInvoices)}
          >
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const customerName = invoice.customer_name ?? invoice.customer?.name;
  const paymentMethod = invoice.payment_method ?? invoice.payment?.method;
  const verificationUrl = invoice.verification_url;

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(invoiceRoutes.myInvoices)}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          <div className="flex gap-2">
            {invoice.pdf_ready && (
              <Button size="sm" disabled={isDownloading} onClick={() => download(invoice.uuid)}>
                <Download className="me-2 h-4 w-4" />
                {t('invoices.downloadPdf')}
              </Button>
            )}
            <Link
              to={invoiceRoutes.verify(invoice.uuid)}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <QrCode className="me-2 h-4 w-4" />
              {t('invoices.actions.verify')}
            </Link>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{invoice.invoice_number}</h1>
              <p className="text-sm text-muted-foreground">
                {t('invoices.createdAt')}: {formatDate(invoice.created_at)}
              </p>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1 text-sm">
              {customerName && <p className="font-medium">{customerName}</p>}
              {invoice.order_number && (
                <p className="text-muted-foreground">
                  {t('invoices.orderNumber')}: <code>{invoice.order_number}</code>
                </p>
              )}
              {paymentMethod && (
                <p className="text-muted-foreground">
                  {t('invoices.paymentMethod')}: {paymentMethod}
                </p>
              )}
            </div>
            <div className="text-end">
              <p className="text-sm text-muted-foreground">{t('invoices.total')}</p>
              <p className="text-3xl font-bold">{formatMoney(invoice.total, invoice.currency)}</p>
            </div>
          </div>
        </div>

        {(invoice.items?.length ?? 0) > 0 && (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center gap-2 border-b p-4">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="font-semibold">{t('invoices.items')}</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoices.item')}</TableHead>
                  <TableHead className="text-end">{t('invoices.qty')}</TableHead>
                  <TableHead className="text-end">{t('invoices.unitPrice')}</TableHead>
                  <TableHead className="text-end">{t('invoices.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name ?? item.product_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-end">{item.quantity}</TableCell>
                    <TableCell className="text-end">
                      {formatMoney(item.unit_price ?? item.price, invoice.currency)}
                    </TableCell>
                    <TableCell className="text-end">
                      {formatMoney(item.total ?? item.line_total, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="font-semibold">{t('invoices.financialSummary')}</h2>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <SummaryRow label={t('invoices.subtotal')} value={formatMoney(invoice.subtotal, invoice.currency)} />
            <SummaryRow
              label={t('invoices.discounts')}
              value={formatMoney(invoice.discounts ?? invoice.discount, invoice.currency)}
            />
            <SummaryRow
              label={t('invoices.shipping')}
              value={formatMoney(invoice.shipping ?? invoice.shipping_price, invoice.currency)}
            />
            <Separator />
            <SummaryRow
              label={t('invoices.total')}
              value={
                <span className="text-base font-semibold">
                  {formatMoney(invoice.total, invoice.currency)}
                </span>
              }
            />
            <SummaryRow
              label={t('invoices.amountPaid')}
              value={
                <span className="font-medium text-green-600">
                  {formatMoney(invoice.amount_paid, invoice.currency)}
                </span>
              }
            />
          </div>
        </div>

        {(invoice.debit_notes?.length ?? 0) > 0 && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
            <div className="flex items-center gap-2">
              <FileMinus className="h-5 w-5 text-destructive" />
              <h2 className="font-semibold">{t('invoices.debitNotes')}</h2>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {invoice.debit_notes?.map((note) => (
                <div key={note.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{note.number ?? `#${note.id}`}</p>
                    {note.reason && <p className="text-muted-foreground">{note.reason}</p>}
                  </div>
                  <p className="font-semibold">{formatMoney(note.amount, invoice.currency)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {verificationUrl && (
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              <h2 className="font-semibold">{t('invoices.verification')}</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t('invoices.verify.authenticHint')}</p>
            <Link
              to={invoiceRoutes.verify(invoice.uuid)}
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t('invoices.actions.verify')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  );
}