import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Printer, ScanLine, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { InvoiceStatusBadge } from '../components/invoice-status-badge';
import { useVerifyInvoice } from '../hooks/use-invoices';
import { formatMoney, formatDate } from '../lib/invoice-utils';

function extractUuid(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/[0-9a-fA-F-]{36}$/);
  return match ? match[0] : trimmed;
}

export function InvoiceVerifyPage() {
  const { uuid: routeUuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [input, setInput] = useState(routeUuid ?? '');
  const [activeUuid, setActiveUuid] = useState(routeUuid ?? '');

  const { data, isLoading, isError, error, refetch } = useVerifyInvoice(activeUuid || undefined);

  const handleVerify = () => {
    const extracted = extractUuid(input);
    if (!extracted) return;
    setActiveUuid(extracted);
  };

  const result = data?.data;
  const isNotFound = isError && (error as { status?: number })?.status === 404;
  const isTampered = !isLoading && !isError && Boolean(result?.tampered);
  const invoice = result?.invoice;
  const isAuthentic = !isLoading && !isError && !isTampered && Boolean(invoice);

  const qrValue = invoice?.verification_url || (activeUuid ? window.location.origin + window.location.pathname : '');

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button
            type="button"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
          >
            ← {t('invoices.verify.backHome')}
          </button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="me-2 h-4 w-4" />
            {t('invoices.verify.print')}
          </Button>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="mb-6 flex items-center gap-3">
            <ScanLine className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{t('invoices.verify.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('invoices.verify.subtitle')}</p>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-2 sm:flex-row print:hidden">
            <Input
              dir="ltr"
              placeholder={t('invoices.verify.inputPlaceholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerify();
              }}
            />
            <Button onClick={handleVerify} disabled={!input.trim()}>
              {t('invoices.verify.button')}
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          )}

          {isNotFound && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-destructive" />
              <h2 className="text-lg font-semibold">{t('invoices.verify.notFound')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('invoices.verify.notFoundHint')}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          )}

          {isTampered && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-destructive" />
              <h2 className="text-lg font-semibold text-destructive">
                {t('invoices.verify.tampered')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('invoices.verify.tamperedHint')}</p>
            </div>
          )}

          {isAuthentic && invoice && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/50">
                <BadgeCheck className="h-10 w-10 shrink-0 text-green-600 dark:text-green-400" />
                <div>
                  <h2 className="text-lg font-semibold text-green-700 dark:text-green-300">
                    {t('invoices.verify.authentic')}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t('invoices.verify.authenticHint')}</p>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('invoices.createdAt')}: {formatDate(invoice.created_at)}
                    </p>
                  </div>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">{t('invoices.orderNumber')}</dt>
                    <dd className="font-medium">{invoice.order_number || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('invoices.customer')}</dt>
                    <dd className="font-medium">
                      {invoice.customer_name ?? invoice.customer?.name ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('invoices.total')}</dt>
                    <dd className="font-semibold">{formatMoney(invoice.total, invoice.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('invoices.currency')}</dt>
                    <dd>{invoice.currency || '—'}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap items-center gap-6 rounded-xl border p-4">
                {qrValue && (
                  <div className="rounded-lg border bg-white p-2">
                    <QRCodeSVG value={qrValue} size={140} />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <p className="font-medium">{t('invoices.verify.qrContent')}</p>
                  <code className="block break-all rounded bg-muted p-2 text-xs">{qrValue}</code>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !isError && !isTampered && !invoice && !activeUuid && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('invoices.verify.enterHint')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}