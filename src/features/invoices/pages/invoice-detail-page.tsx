import { useState, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CreditCard,
  FileMinus,
  FileText,
  MapPin,
  PencilLine,
  QrCode,
  RefreshCw,
  ShoppingCart,
  UserRound,
  XCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useInvoice, useRegenerateInvoice } from '../hooks/use-invoices';
import { InvoiceStatusBadge } from '../components/invoice-status-badge';
import { InvoicePdfPanel } from '../components/invoice-pdf-panel';
import { InvoiceAddressView } from '../components/invoice-address';
import { CorrectInvoiceDialog } from '../components/correct-invoice-dialog';
import { CancelInvoiceDialog } from '../components/cancel-invoice-dialog';
import { DebitNoteDialog } from '../components/debit-note-dialog';
import { formatMoney, formatDate, canBeCorrected, isCancelable } from '../lib/invoice-utils';
import { invoiceRoutes } from '../routes/invoice.routes';
import { INVOICE_PERMISSIONS } from '../permissions/invoice.permissions';

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function InfoSection({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const [correctOpen, setCorrectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [debitOpen, setDebitOpen] = useState(false);

  const { data, isLoading } = useInvoice(id ? Number(id) : undefined, { pollPdf: true });
  const invoice = data?.data;
  const regenerateMutation = useRegenerateInvoice();

  const canDownload = hasPermission(INVOICE_PERMISSIONS.download);
  const canRegenerate = hasPermission(INVOICE_PERMISSIONS.regenerate);
  const canCorrect = hasPermission(INVOICE_PERMISSIONS.correct);
  const canCancel = hasPermission(INVOICE_PERMISSIONS.cancel);
  const canDebit = hasPermission(INVOICE_PERMISSIONS.issueDebitNote);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">{t('invoices.notFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(invoiceRoutes.list)}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const showRegenerate = canRegenerate && invoice.status === 'failed';
  const showCorrect = canCorrect && canBeCorrected(invoice.status);
  const showCancel = canCancel && isCancelable(invoice.status);
  const showDebit = canDebit;

  const customerName = invoice.customer_name ?? invoice.customer?.name;
  const customerEmail = invoice.customer_email ?? invoice.customer?.email;
  const customerPhone = invoice.customer?.phone;
  const paymentMethod = invoice.payment_method ?? invoice.payment?.method;
  const paymentGateway = invoice.payment_gateway ?? invoice.payment?.gateway;
  const transactionId = invoice.transaction_id ?? invoice.payment?.transaction_id;

  const timeline = invoice.timeline ?? invoice.audit_log ?? [];
  const debitNotes = invoice.debit_notes ?? [];
  const creditNotes = invoice.credit_notes ?? [];
  const corrections = invoice.corrections ?? invoice.correction_chain ?? [];
  const verificationUrl = invoice.verification_url;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(invoiceRoutes.list)}>
          <ArrowLeft className="me-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {showRegenerate && (
            <Button
              variant="outline"
              size="sm"
              disabled={regenerateMutation.isPending}
              onClick={() => regenerateMutation.mutate(invoice.id)}
            >
              <RefreshCw className="me-2 h-4 w-4" />
              {t('invoices.actions.regenerate')}
            </Button>
          )}
          {verificationUrl && (
            <Link
              to={invoiceRoutes.verify(invoice.uuid)}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <QrCode className="me-2 h-4 w-4" />
              {t('invoices.actions.verify')}
            </Link>
          )}
          {showCorrect && (
            <Button size="sm" onClick={() => setCorrectOpen(true)}>
              <PencilLine className="me-2 h-4 w-4" />
              {t('invoices.actions.correct')}
            </Button>
          )}
          {showDebit && (
            <Button size="sm" variant="outline" onClick={() => setDebitOpen(true)}>
              <FileMinus className="me-2 h-4 w-4" />
              {t('invoices.actions.debitNote')}
            </Button>
          )}
          {showCancel && (
            <Button size="sm" variant="destructive" onClick={() => setCancelOpen(true)}>
              <XCircle className="me-2 h-4 w-4" />
              {t('invoices.actions.cancel')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{invoice.invoice_number}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>
              {t('invoices.createdAt')}: {formatDate(invoice.created_at)}
            </p>
            {invoice.issued_at && (
              <p>
                {t('invoices.issuedAt')}: {formatDate(invoice.issued_at)}
              </p>
            )}
            {invoice.paid_at && (
              <p>
                {t('invoices.paidAt')}: {formatDate(invoice.paid_at)}
              </p>
            )}
          </div>
        </div>
        <div className="w-full sm:w-72">
          <InvoicePdfPanel
            invoice={invoice}
            canDownload={canDownload}
            canRegenerate={canRegenerate}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InfoSection title={t('invoices.items')} icon={<ShoppingCart className="h-5 w-5" />}>
            {(invoice.items?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">{t('invoices.noItems')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.item')}</TableHead>
                    <TableHead>{t('invoices.sku')}</TableHead>
                    <TableHead className="text-end">{t('invoices.qty')}</TableHead>
                    <TableHead className="text-end">{t('invoices.unitPrice')}</TableHead>
                    <TableHead className="text-end">{t('invoices.discount')}</TableHead>
                    <TableHead className="text-end">{t('invoices.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="block max-w-[220px] truncate font-medium">
                          {item.name ?? item.product_name ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {item.sku ?? item.product_sku ?? '—'}
                        </code>
                      </TableCell>
                      <TableCell className="text-end">{item.quantity}</TableCell>
                      <TableCell className="text-end">
                        {formatMoney(item.unit_price ?? item.price, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-end text-green-600">
                        {item.discount ? `-${formatMoney(item.discount, invoice.currency)}` : '—'}
                      </TableCell>
                      <TableCell className="text-end font-medium">
                        {formatMoney(
                          item.total ?? item.total_price ?? item.line_total,
                          invoice.currency
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </InfoSection>

          <InfoSection title={t('invoices.financialSummary')} icon={<FileText className="h-5 w-5" />}>
            <div className="space-y-2 text-sm">
              <InfoRow label={t('invoices.subtotal')} value={formatMoney(invoice.subtotal, invoice.currency)} />
              <InfoRow
                label={t('invoices.discounts')}
                value={formatMoney(invoice.discounts ?? invoice.discount, invoice.currency)}
              />
              <InfoRow
                label={t('invoices.shipping')}
                value={formatMoney(invoice.shipping ?? invoice.shipping_price, invoice.currency)}
              />
              <Separator />
              <InfoRow
                label={t('invoices.total')}
                value={<span className="text-base font-semibold">{formatMoney(invoice.total, invoice.currency)}</span>}
              />
              <InfoRow
                label={t('invoices.amountPaid')}
                value={<span className="text-green-600">{formatMoney(invoice.amount_paid, invoice.currency)}</span>}
              />
            </div>
          </InfoSection>

          <InfoSection title={t('invoices.timeline')} icon={<FileText className="h-5 w-5" />}>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('invoices.noTimeline')}</p>
            ) : (
              <ol className="space-y-4">
                {timeline.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {event.status && <InvoiceStatusBadge status={event.status} />}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(event.created_at)}
                        </span>
                      </div>
                      {event.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </InfoSection>

          {(debitNotes.length > 0 || creditNotes.length > 0) && (
            <InfoSection title={t('invoices.notes')} icon={<FileMinus className="h-5 w-5" />}>
              <div className="space-y-4">
                {debitNotes.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-destructive">
                      {t('invoices.debitNotes')}
                    </h3>
                    <NoteList notes={debitNotes} currency={invoice.currency} />
                  </div>
                )}
                {creditNotes.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-green-600">
                      {t('invoices.creditNotes')}
                    </h3>
                    <NoteList notes={creditNotes} currency={invoice.currency} />
                  </div>
                )}
              </div>
            </InfoSection>
          )}

          {corrections.length > 0 && (
            <InfoSection title={t('invoices.corrections')} icon={<PencilLine className="h-5 w-5" />}>
              <div className="space-y-2">
                {corrections.map((correction) => (
                  <div key={correction.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link
                      to={invoiceRoutes.detail(correction.id)}
                      className="font-medium text-primary hover:underline"
                    >
                      {correction.invoice_number ?? `#${correction.id}`}
                    </Link>
                    {correction.status && <InvoiceStatusBadge status={correction.status} />}
                  </div>
                ))}
              </div>
            </InfoSection>
          )}

          {verificationUrl && (
            <InfoSection title={t('invoices.verification')} icon={<QrCode className="h-5 w-5" />}>
              <div className="flex flex-wrap items-center gap-6">
                <QRCodeSVG value={verificationUrl} size={160} />
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <p className="text-muted-foreground">{t('invoices.verificationHint')}</p>
                  <code className="block break-all rounded bg-muted p-2 text-xs">{verificationUrl}</code>
                  <Link
                    to={invoiceRoutes.verify(invoice.uuid)}
                    className="inline-block pt-2 font-medium text-primary hover:underline"
                  >
                    {t('invoices.actions.verify')}
                  </Link>
                </div>
              </div>
            </InfoSection>
          )}
        </div>

        <div className="space-y-6">
          <InfoSection title={t('invoices.customer')} icon={<UserRound className="h-5 w-5" />}>
            <div className="space-y-3 text-sm">
              {customerName && <p className="font-medium">{customerName}</p>}
              {customerEmail && (
                <p className="text-muted-foreground">{customerEmail}</p>
              )}
              {customerPhone && (
                <p dir="ltr" className="text-muted-foreground">
                  {customerPhone}
                </p>
              )}
              {!customerName && !customerEmail && !customerPhone && (
                <p className="text-muted-foreground">—</p>
              )}
            </div>
          </InfoSection>

          <InfoSection title={t('invoices.orderInfo')} icon={<ShoppingCart className="h-5 w-5" />}>
            <div className="space-y-2 text-sm">
              <InfoRow
                label={t('invoices.orderNumber')}
                value={
                  invoice.order_number ? (
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {invoice.order_number}
                    </code>
                  ) : (
                    '—'
                  )
                }
              />
              {invoice.order_id && (
                <Link
                  to={`/orders/${invoice.order_id}`}
                  className={buttonVariants({ variant: 'link', size: 'sm', className: 'h-auto p-0' })}
                >
                  {t('invoices.viewOrder')}
                </Link>
              )}
            </div>
          </InfoSection>

          <InfoSection title={t('invoices.billingAddress')} icon={<MapPin className="h-5 w-5" />}>
            <InvoiceAddressView address={invoice.billing_address} />
          </InfoSection>

          <InfoSection title={t('invoices.shippingAddress')} icon={<MapPin className="h-5 w-5" />}>
            <InvoiceAddressView address={invoice.shipping_address} />
          </InfoSection>

          <InfoSection title={t('invoices.payment')} icon={<CreditCard className="h-5 w-5" />}>
            <div className="space-y-2 text-sm">
              <InfoRow label={t('invoices.paymentMethod')} value={paymentMethod ?? '—'} />
              <InfoRow label={t('invoices.paymentGateway')} value={paymentGateway ?? '—'} />
              <InfoRow
                label={t('invoices.transactionId')}
                value={transactionId ? <code className="text-xs">{transactionId}</code> : '—'}
              />
            </div>
          </InfoSection>

          {invoice.original_invoice_number && (
            <InfoSection title={t('invoices.originalInvoice')} icon={<PencilLine className="h-5 w-5" />}>
              <Link
                to={invoiceRoutes.detail(invoice.original_id ?? 0)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {invoice.original_invoice_number}
              </Link>
            </InfoSection>
          )}

          {invoice.notes && (
            <InfoSection title={t('invoices.notesOverride')} icon={<FileText className="h-5 w-5" />}>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </InfoSection>
          )}
        </div>
      </div>

      <CorrectInvoiceDialog
        invoice={invoice}
        open={correctOpen}
        onOpenChange={setCorrectOpen}
      />
      <CancelInvoiceDialog
        invoice={invoice}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
      <DebitNoteDialog
        invoice={invoice}
        open={debitOpen}
        onOpenChange={setDebitOpen}
      />
    </div>
  );
}

function NoteList({ notes, currency }: { notes: Array<{ id: number; number?: string; amount?: number; reason?: string; created_at?: string }>; currency?: string | null }) {
  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <div key={note.id} className="rounded-lg border p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{note.number ?? `#${note.id}`}</span>
            <span className="font-semibold">{formatMoney(note.amount, currency)}</span>
          </div>
          {note.reason && <p className="mt-1 text-muted-foreground">{note.reason}</p>}
          {note.created_at && (
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(note.created_at)}</p>
          )}
        </div>
      ))}
    </div>
  );
}