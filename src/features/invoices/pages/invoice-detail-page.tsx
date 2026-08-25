import { useState, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Boxes,
  Copy,
  CreditCard,
  FileMinus,
  FileText,
  Gift,
  History,
  MapPin,
  PencilLine,
  QrCode,
  RefreshCw,
  ShoppingCart,
  Truck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
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
import { usePermissions } from '@/shared/auth/guards';
import { useInvoice, useRegenerateInvoice } from '../hooks/use-invoices';
import { InvoiceStatusBadge } from '../components/invoice-status-badge';
import { InvoicePdfPanel } from '../components/invoice-pdf-panel';
import { InvoiceAddressView } from '../components/invoice-address';
import { CorrectInvoiceDialog } from '../components/correct-invoice-dialog';
import { CancelInvoiceDialog } from '../components/cancel-invoice-dialog';
import { DebitNoteDialog } from '../components/debit-note-dialog';
import {
  formatMoney,
  formatDate,
  canBeCorrected,
  isCancelable,
  getInvoiceCustomerName,
  getInvoiceOrderNumber,
  getSnapshotItems,
  getPricingRows,
  getBillingAddress,
  getShippingAddress,
  getPaymentView,
  humanizeStatus,
} from '../lib/invoice-utils';
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
  const { can: hasPermission } = usePermissions();

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

  const showRegenerate =
    canRegenerate && ['failed', 'ready', 'generated'].includes(invoice.status);
  const showCorrect = canCorrect && canBeCorrected(invoice.status);
  const showCancel = canCancel && isCancelable(invoice.status);
  const showDebit = canDebit;

  const customerName = getInvoiceCustomerName(invoice);
  const customerEmail = invoice.customer_email ?? invoice.customer?.email;
  const customerPhone = invoice.customer?.phone;
  const payment = getPaymentView(invoice);
  const transactionId = invoice.transaction_id ?? invoice.payment?.transaction_id;
  const orderNumber = getInvoiceOrderNumber(invoice);
  const snapshotOrder = invoice.snapshot?.order;

  const items = getSnapshotItems(invoice);
  const pricingRows = getPricingRows(invoice);
  const billingAddress = getBillingAddress(invoice);
  const shippingAddress = getShippingAddress(invoice);

  const timeline = invoice.timeline ?? invoice.audit_log ?? [];
  const debitNotes = invoice.debit_notes ?? [];
  const creditNotes = invoice.credit_notes ?? [];
  const corrections = invoice.corrections ?? invoice.correction_chain ?? [];

  const qrPayload = invoice.qr_content
    ? JSON.stringify(invoice.qr_content)
    : invoice.verification_url;
  const verificationUrl = invoice.verification_url;

  const copyHash = (hash?: string | null) => {
    if (!hash) return;
    navigator.clipboard
      .writeText(hash)
      .then(() => toast.success(t('invoices.copied')))
      .catch(() => toast.error(t('invoices.copyFailed')));
  };

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
            {invoice.generated_at && (
              <p>
                {t('invoices.generatedAt')}: {formatDate(invoice.generated_at)}
              </p>
            )}
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
            {invoice.is_correction && (
              <Badge variant="outline" className="border-orange-300 text-orange-600">
                {t('invoices.correctionInvoice')}
              </Badge>
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
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('invoices.noItems')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.item')}</TableHead>
                    <TableHead>{t('invoices.sku')}</TableHead>
                    <TableHead className="text-end">{t('invoices.qty')}</TableHead>
                    <TableHead className="text-end">{t('invoices.unitPrice')}</TableHead>
                    <TableHead className="text-end">{t('invoices.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={`${item.product_sku}-${index}`}>
                      <TableCell>
                        <span className="flex items-center gap-1.5 font-medium">
                          {item.is_gift && (
                            <Gift className="h-3.5 w-3.5 shrink-0 text-pink-500" aria-label={t('invoices.giftItem')} />
                          )}
                          <span className="max-w-[220px] truncate">{item.product_name}</span>
                        </span>
                        {item.attributes && (
                          <span className="block max-w-[220px] truncate text-xs text-muted-foreground">
                            {item.attributes}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {item.product_sku}
                        </code>
                      </TableCell>
                      <TableCell className="text-end">{item.quantity}</TableCell>
                      <TableCell className="text-end">
                        {formatMoney(item.unit_price, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-end font-medium">
                        {formatMoney(item.total_price, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </InfoSection>

          <InfoSection title={t('invoices.financialSummary')} icon={<FileText className="h-5 w-5" />}>
            <div className="space-y-2 text-sm">
              {pricingRows.map((row) =>
                row.label === 'total' ? (
                  <div key={row.label} className="pt-1">
                    <Separator />
                    <InfoRow
                      label={t('invoices.total')}
                      value={
                        <span className="text-base font-semibold">
                          {formatMoney(row.value, invoice.currency)}
                        </span>
                      }
                    />
                  </div>
                ) : (
                  <InfoRow
                    key={row.label}
                    label={t(`invoices.breakdown.${row.label}`)}
                    value={formatMoney(row.value, invoice.currency)}
                  />
                )
              )}
              {Number(invoice.amount_paid) > 0 && (
                <InfoRow
                  label={t('invoices.amountPaid')}
                  value={
                    <span className="text-green-600">
                      {formatMoney(invoice.amount_paid, invoice.currency)}
                    </span>
                  }
                />
              )}
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

          {(qrPayload || invoice.verification_hash) && (
            <InfoSection title={t('invoices.verification')} icon={<QrCode className="h-5 w-5" />}>
              <div className="flex flex-wrap items-start gap-6">
                {qrPayload && <QRCodeSVG value={qrPayload} size={160} />}
                <div className="min-w-0 flex-1 space-y-2 text-sm">
                  <p className="text-muted-foreground">{t('invoices.verificationHint')}</p>
                  {verificationUrl && (
                    <code className="block break-all rounded bg-muted p-2 text-xs">
                      {verificationUrl}
                    </code>
                  )}
                  <div className="space-y-1">
                    <HashRow
                      label={t('invoices.snapshotHash')}
                      hash={invoice.snapshot_hash}
                      onCopy={() => copyHash(invoice.snapshot_hash)}
                    />
                    <HashRow
                      label={t('invoices.verificationHash')}
                      hash={invoice.verification_hash}
                      onCopy={() => copyHash(invoice.verification_hash)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {t('invoices.verifyCount')}: {invoice.verify_count ?? 0}
                    </span>
                    {invoice.last_verified_at && (
                      <span>
                        {t('invoices.lastVerifiedAt')}: {formatDate(invoice.last_verified_at)}
                      </span>
                    )}
                    {invoice.snapshot?.snapshot_version && (
                      <span>
                        {t('invoices.snapshotVersion')}:{' '}
                        {invoice.snapshot.snapshot_version}
                        {invoice.snapshot.snapshot_schema
                          ? ` (schema ${invoice.snapshot.snapshot_schema})`
                          : ''}
                      </span>
                    )}
                  </div>
                  {verificationUrl && (
                    <Link
                      to={invoiceRoutes.verify(invoice.uuid)}
                      className="inline-block pt-1 font-medium text-primary hover:underline"
                    >
                      {t('invoices.actions.verify')}
                    </Link>
                  )}
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
                  orderNumber ? (
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {orderNumber}
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
              {invoice.view_url && (
                <a
                  href={invoice.view_url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: 'link', size: 'sm', className: 'h-auto p-0' })}
                >
                  {t('invoices.openCustomerView')}
                </a>
              )}
              {snapshotOrder && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline">{humanizeStatus(snapshotOrder.status)}</Badge>
                  <Badge variant="outline">{humanizeStatus(snapshotOrder.payment_status)}</Badge>
                  {snapshotOrder.fulfillment_status && (
                    <Badge variant="outline">
                      {humanizeStatus(snapshotOrder.fulfillment_status)}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </InfoSection>

          {invoice.snapshot?.fulfillment && (
            <InfoSection title={t('invoices.fulfillment')} icon={<Truck className="h-5 w-5" />}>
              <div className="space-y-2 text-sm">
                <InfoRow
                  label={t('invoices.fulfillmentType')}
                  value={
                    invoice.snapshot?.pickup_location
                      ? t('invoices.pickup')
                      : humanizeStatus(invoice.snapshot.fulfillment.type ?? '—')
                  }
                />
                {invoice.snapshot.fulfillment.shipping_method && (
                  <InfoRow
                    label={t('invoices.shippingMethod')}
                    value={invoice.snapshot.fulfillment.shipping_method}
                  />
                )}
                <InfoRow
                  label={t('invoices.breakdown.shipping')}
                  value={formatMoney(invoice.snapshot.fulfillment.shipping_price, invoice.currency)}
                />
                {Boolean(invoice.snapshot.fulfillment.fast_shipping_fee) && (
                  <InfoRow
                    label={t('invoices.breakdown.fastShippingFee')}
                    value={formatMoney(invoice.snapshot.fulfillment.fast_shipping_fee, invoice.currency)}
                  />
                )}
                {invoice.snapshot.fulfillment.expected_delivery_at && (
                  <InfoRow
                    label={t('invoices.expectedDelivery')}
                    value={formatDate(invoice.snapshot.fulfillment.expected_delivery_at)}
                  />
                )}
              </div>
            </InfoSection>
          )}

          {invoice.snapshot?.pickup_location && (
            <InfoSection title={t('invoices.pickupLocation')} icon={<Boxes className="h-5 w-5" />}>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{invoice.snapshot.pickup_location.name ?? '—'}</p>
                {invoice.snapshot.pickup_location.address && (
                  <p className="text-muted-foreground">{invoice.snapshot.pickup_location.address}</p>
                )}
                {invoice.snapshot.pickup_location.phone && (
                  <p dir="ltr" className="text-muted-foreground">
                    {invoice.snapshot.pickup_location.phone}
                  </p>
                )}
                {invoice.snapshot.pickup_location.coordinates && (
                  <p dir="ltr" className="font-mono text-xs text-muted-foreground">
                    {invoice.snapshot.pickup_location.coordinates}
                  </p>
                )}
              </div>
            </InfoSection>
          )}

          <InfoSection title={t('invoices.billingAddress')} icon={<MapPin className="h-5 w-5" />}>
            <InvoiceAddressView address={billingAddress} />
          </InfoSection>

          <InfoSection title={t('invoices.shippingAddress')} icon={<MapPin className="h-5 w-5" />}>
            <InvoiceAddressView address={shippingAddress} />
          </InfoSection>

          <InfoSection title={t('invoices.payment')} icon={<CreditCard className="h-5 w-5" />}>
            <div className="space-y-2 text-sm">
              <InfoRow
                label={t('invoices.paymentMethod')}
                value={payment.method ? humanizeStatus(payment.method) : '—'}
              />
              <InfoRow label={t('invoices.paymentGateway')} value={payment.gateway ?? '—'} />
              <InfoRow
                label={t('invoices.paidAt')}
                value={payment.paidAt ? formatDate(payment.paidAt) : '—'}
              />
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

          {(invoice.corrected_at ||
            invoice.cancelled_at ||
            invoice.downloaded_at ||
            invoice.printed_at ||
            invoice.archived_at ||
            invoice.generation_attempts != null ||
            invoice.snapshot?.audit?.generated_by) && (
            <InfoSection title={t('invoices.lifecycle')} icon={<History className="h-5 w-5" />}>
              <div className="space-y-2 text-sm">
                {invoice.generated_at && (
                  <InfoRow label={t('invoices.generatedAt')} value={formatDate(invoice.generated_at)} />
                )}
                {invoice.pdf_generated_at && (
                  <InfoRow
                    label={t('invoices.pdfGeneratedAt')}
                    value={formatDate(invoice.pdf_generated_at)}
                  />
                )}
                {invoice.generation_attempts != null && (
                  <InfoRow label={t('invoices.generationAttempts')} value={invoice.generation_attempts} />
                )}
                {invoice.verified_at && (
                  <InfoRow label={t('invoices.verifiedAt')} value={formatDate(invoice.verified_at)} />
                )}
                {invoice.downloaded_at && (
                  <InfoRow label={t('invoices.downloadedAt')} value={formatDate(invoice.downloaded_at)} />
                )}
                {invoice.printed_at && (
                  <InfoRow label={t('invoices.printedAt')} value={formatDate(invoice.printed_at)} />
                )}
                {invoice.corrected_at && (
                  <>
                    <InfoRow
                      label={t('invoices.correctedAt')}
                      value={formatDate(invoice.corrected_at)}
                    />
                    {invoice.correction_reason && (
                      <p className="text-xs text-muted-foreground">
                        {t('invoices.correctionReason')}: {invoice.correction_reason}
                      </p>
                    )}
                  </>
                )}
                {invoice.cancelled_at && (
                  <>
                    <InfoRow
                      label={t('invoices.cancelledAt')}
                      value={<span className="text-destructive">{formatDate(invoice.cancelled_at)}</span>}
                    />
                    {invoice.cancellation_reason && (
                      <p className="text-xs text-muted-foreground">
                        {t('invoices.cancellationReason')}: {invoice.cancellation_reason}
                      </p>
                    )}
                  </>
                )}
                {invoice.archived_at && (
                  <InfoRow label={t('invoices.archivedAt')} value={formatDate(invoice.archived_at)} />
                )}
                {invoice.snapshot?.audit?.generated_by && (
                  <InfoRow
                    label={t('invoices.generatedBy')}
                    value={humanizeStatus(invoice.snapshot.audit.generated_by)}
                  />
                )}
              </div>
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

function HashRow({ label, hash, onCopy }: { label: string; hash?: string | null; onCopy: () => void }) {
  const { t } = useTranslation();
  if (!hash) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <code className="min-w-0 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
        {hash}
      </code>
      <Button
        variant="ghost"
        size="icon-sm"
        className="h-6 w-6"
        title={t('common.copy')}
        onClick={onCopy}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}