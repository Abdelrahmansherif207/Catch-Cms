import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useInvoiceDownload, useRegenerateInvoice } from '../hooks/use-invoices';
import { isPdfPending, isPdfTerminal } from '../lib/invoice-utils';
import type { InvoiceDetail } from '../types/invoice.types';

interface InvoicePdfPanelProps {
  invoice: InvoiceDetail;
  canDownload?: boolean;
  canRegenerate?: boolean;
}

export function InvoicePdfPanel({ invoice, canDownload, canRegenerate }: InvoicePdfPanelProps) {
  const { t } = useTranslation();
  const { download, isDownloading } = useInvoiceDownload();
  const regenerateMutation = useRegenerateInvoice();
  const status = invoice.status;

  if (isPdfPending(status)) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/50">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span>{t('invoices.pdf.generating')}</span>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>{t('invoices.pdf.failed')}</span>
        </div>
        {canRegenerate && (
          <Button
            size="sm"
            variant="outline"
            disabled={regenerateMutation.isPending}
            onClick={() => regenerateMutation.mutate(invoice.id)}
          >
            {regenerateMutation.isPending ? (
              <Loader2 className="me-1 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="me-1 h-4 w-4" />
            )}
            {t('invoices.pdf.retry')}
          </Button>
        )}
      </div>
    );
  }

  if (isPdfTerminal(status) && status === 'ready') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/50">
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>{t('invoices.pdf.ready')}</span>
        </div>
        {canDownload && (
          <Button
            size="sm"
            disabled={isDownloading}
            onClick={() => download(invoice.uuid)}
          >
            {isDownloading ? (
              <Loader2 className="me-1 h-4 w-4 animate-spin" />
            ) : (
              <Download className="me-1 h-4 w-4" />
            )}
            {t('invoices.pdf.download')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <FileText className="h-4 w-4" />
      <span>{t('invoices.pdf.notReady')}</span>
    </div>
  );
}