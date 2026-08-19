import { useParams, useNavigate, Link } from 'react-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  FileText,
  QrCode,
  ShieldAlert,
  ShieldBan,
  ShoppingCart,
} from 'lucide-react';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Separator } from '@/shared/ui/separator';
import { useOrderInvoice } from '../hooks/use-orders';
import { orderRoutes } from '../routes/order.routes';
import { invoiceRoutes } from '@/features/invoices/routes/invoice.routes';
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge';
import type { InvoiceDetail } from '@/features/invoices/types/invoice.types';

export function OrderInvoiceViewPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data, isLoading, isError, error, refetch } = useOrderInvoice(uuid);
  const view = data?.data;

  const statusCode = (error as { status?: number } | null)?.status;
  const isForbidden = isError && statusCode === 403;
  const isNotFound = isError && statusCode === 404;

  const invoice: InvoiceDetail | null =
    view?.invoice ??
    (view && (view.invoice_number || view.status || view.total !== undefined)
      ? (view as unknown as InvoiceDetail)
      : null);

  const verificationUuid = invoice?.uuid ?? uuid;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(orderRoutes.myOrders)}>
          <ArrowLeft className="me-2 h-4 w-4" />
          {t('common.back')}
        </Button>

        {isForbidden && (
          <StateCard
            icon={<ShieldBan className="mx-auto mb-3 h-12 w-12 text-destructive" />}
            title={t('orders.invoiceView.forbidden')}
            hint={t('orders.invoiceView.forbiddenHint')}
          />
        )}

        {isNotFound && (
          <StateCard
            icon={<ShieldAlert className="mx-auto mb-3 h-12 w-12 text-destructive" />}
            title={t('orders.invoiceView.notFound')}
            hint={t('orders.invoiceView.notFoundHint')}
            action={
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        )}

        {isError && !isForbidden && !isNotFound && (
          <StateCard
            icon={<AlertCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />}
            title={t('orders.invoiceView.error')}
            hint={t('orders.invoiceView.errorHint')}
            action={
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        )}

        {!isError && invoice && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{invoice.invoice_number}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('orders.createdAt')}: {formatDate(invoice.created_at)}
                </p>
              </div>
              <InvoiceStatusBadge status={invoice.status ?? 'pending'} />
            </div>

            {(invoice.items?.length ?? 0) > 0 && (
              <div className="rounded-xl border bg-card p-6">
                <div className="mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <h2 className="font-semibold">{t('orders.invoiceView.items')}</h2>
                </div>
                <div className="space-y-2">
                  {invoice.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {item.name ?? item.product_name ?? '—'}
                        </p>
                        {item.product_sku && (
                          <code className="text-xs text-muted-foreground">{item.product_sku}</code>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="text-muted-foreground">x{item.quantity}</span>
                        <span className="font-medium">
                          {formatMoney(item.total ?? item.line_total, invoice.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h2 className="font-semibold">{t('orders.invoiceView.summary')}</h2>
              </div>
              <div className="space-y-2 text-sm">
                <SummaryRow label={t('orders.invoiceView.subtotal')} value={formatMoney(invoice.subtotal, invoice.currency)} />
                <SummaryRow label={t('orders.invoiceView.discounts')} value={formatMoney(invoice.discounts ?? invoice.discount, invoice.currency)} />
                <SummaryRow label={t('orders.invoiceView.shipping')} value={formatMoney(invoice.shipping ?? invoice.shipping_price, invoice.currency)} />
                <Separator />
                <SummaryRow
                  label={t('orders.invoiceView.total')}
                  value={
                    <span className="text-base font-semibold">
                      {formatMoney(invoice.total, invoice.currency)}
                    </span>
                  }
                />
                <SummaryRow
                  label={t('orders.invoiceView.amountPaid')}
                  value={
                    <span className="font-medium text-green-600">
                      {formatMoney(invoice.amount_paid, invoice.currency)}
                    </span>
                  }
                />
                {invoice.order_number && (
                  <SummaryRow
                    label={t('orders.invoiceView.orderNumber')}
                    value={<code>{invoice.order_number}</code>}
                  />
                )}
                {invoice.customer_name && (
                  <SummaryRow label={t('orders.invoiceView.customer')} value={invoice.customer_name} />
                )}
                {(invoice.payment_method ?? invoice.payment?.method) && (
                  <SummaryRow
                    label={t('orders.invoiceView.paymentMethod')}
                    value={invoice.payment_method ?? invoice.payment?.method ?? '—'}
                  />
                )}
              </div>
            </div>

            {view?.snapshot !== undefined && view.snapshot !== null && (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="mb-3 font-semibold">{t('orders.invoiceView.snapshot')}</h2>
                <SnapshotView data={view.snapshot} />
              </div>
            )}

            {verificationUuid && (
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-green-600" />
                  <h2 className="font-semibold">{t('orders.invoiceView.verification')}</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('orders.invoiceView.verificationHint')}
                </p>
                <Link
                  to={invoiceRoutes.verify(verificationUuid)}
                  className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-3' })}
                >
                  <QrCode className="me-2 h-4 w-4" />
                  {t('orders.invoiceView.verifyButton')}
                </Link>
              </div>
            )}
          </div>
        )}

        {!isLoading && !isError && !invoice && (
          <StateCard
            icon={<ShieldAlert className="mx-auto mb-3 h-12 w-12 text-destructive" />}
            title={t('orders.invoiceView.notFound')}
            hint={t('orders.invoiceView.notFoundHint')}
          />
        )}
      </div>
    </div>
  );
}

function StateCard({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
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

function formatMoney(value: number | string | null | undefined, currency?: string | null): string {
  const num = Number(value ?? 0);
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function SnapshotView({ data }: { data: unknown }) {
  if (data == null) return <p className="text-sm text-muted-foreground">—</p>;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        return <p className="text-sm text-muted-foreground">{data}</p>;
      }
      return <SnapshotView data={parsed} />;
    }
    return <p className="text-sm text-muted-foreground">{data}</p>;
  }

  if (Array.isArray(data)) {
    return (
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="rounded-lg border p-3">
            <SnapshotView data={item} />
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
      </div>
    );
  }

  if (isRecord(data)) {
    const entries = Object.entries(data).filter(
      ([, v]) => v !== null && v !== undefined && v !== ''
    );
    if (entries.length === 0) return <p className="text-sm text-muted-foreground">—</p>;
    return (
      <div className="space-y-1.5 text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">{humanizeKey(key)}</span>
            <span className="min-w-0 text-end font-medium">
              {isRecord(value) || Array.isArray(value) ? (
                <pre className="max-h-40 max-w-full overflow-auto rounded bg-muted p-2 text-xs text-start">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                String(value)
              )}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">{String(data)}</p>;
}