import { useTranslation } from 'react-i18next';
import { Download, Loader2, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import type { FileOperationConnectionState } from '@/shared/lib/file-operations';
import { FileOpBadge } from './file-op-badge';
import { FileOpProgress } from './file-op-progress';
import { FileOpConnectionHint } from './file-op-connection-hint';

export type FileExportResource = 'brands' | 'categories' | 'products';

export interface FileExportStatus {
  status: string;
  progress?: number | null;
  total_rows?: number | null;
  processed_rows?: number | null;
  successful_rows?: number | null;
  failed_rows?: number | null;
}

export interface FileExportApi {
  start: (filters?: unknown) => void;
  isStarting: boolean;
  phase: string;
  exportId: number | null;
  status: FileExportStatus | null;
  connectionState?: FileOperationConnectionState;
  download: () => void;
  reset: () => void;
}

interface FileExportDialogProps {
  ns: FileExportResource;
  api: FileExportApi;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Single production export dialog for brands/categories/products.
 * Fully event-driven: `starting` (start POST) → `processing` (Pusher
 * `queued`/`progress`/terminal events) → success screen with manual
 * re-download (auto-download fires from the hook) or failed + Retry.
 */
export function FileExportDialog({ ns, api, open, onOpenChange }: FileExportDialogProps) {
  const { t } = useTranslation();

  const busy = api.phase === 'starting' || api.phase === 'processing';
  const isQueued = busy && (api.status == null || api.status.status === 'pending');
  const isCompleted = api.phase === 'completed';
  const isFailed = api.phase === 'failed';

  const status = api.status;
  const done = status?.processed_rows || 0;
  const total = status?.total_rows || null;
  const derivedProgress =
    status?.progress ??
    (total && total > 0 ? Math.min(99, Math.round((done / total) * 100)) : null);

  const handleOpenChange = (
    next: boolean,
    details?: { cancel: () => void; reason?: string },
  ) => {
    if (next) {
      if (!busy) {
        api.reset();
      }
      onOpenChange(true);
      return;
    }
    // X always closes (the file keeps generating/downloading); block only
    // accidental outside-press / escape while running.
    if (
      busy &&
      (details?.reason === 'outside-press' || details?.reason === 'escape-key')
    ) {
      details.cancel();
      return;
    }
    onOpenChange(false);
  };

  const handleExport = () => {
    if (busy || api.isStarting) return;
    api.start();
  };

  const handleRetry = () => {
    api.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {busy
              ? t(`${ns}.exportProcessing`)
              : isFailed
                ? t(`${ns}.exportFailed`)
                : isCompleted
                  ? t('common.exportCompletedTitle')
                  : t(`${ns}.exportDialogTitle`)}
          </DialogTitle>
          <DialogDescription>
            {isQueued
              ? t('common.queuedSubtitle')
              : busy
                ? t(`${ns}.exportProcessingSubtitle`)
                : isFailed || isCompleted
                  ? ''
                  : t(`${ns}.exportDialogDesc`)}
          </DialogDescription>
        </DialogHeader>

        {(busy || isCompleted || isFailed) && (
          <div className="flex items-center justify-center">
            <FileOpBadge
              state={isCompleted ? 'completed' : isFailed ? 'failed' : (status?.status ?? 'pending')}
              live={api.connectionState === 'live' || api.connectionState === undefined}
            />
          </div>
        )}

        <div className="space-y-4">
          {busy && !isQueued && status && (
            <FileOpProgress
              progress={derivedProgress}
              processed={status.processed_rows}
              total={status.total_rows}
              success={status.successful_rows}
              failed={status.failed_rows}
              successLabel={t(`${ns}.successRows`)}
            />
          )}

          {isQueued && (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('common.queuedSubtitle')}</p>
            </div>
          )}

          {api.phase === 'starting' && !status && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm font-medium">{t(`${ns}.exporting`)}</p>
            </div>
          )}

          {isCompleted && (
            <div className="flex flex-col items-center gap-2 py-2">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                {t('common.exportCompletedDesc')}
              </p>
              <Button variant="outline" className="w-full" onClick={api.download}>
                <Download className="mr-2 h-4 w-4" />
                {t('common.downloadAgain')}
              </Button>
            </div>
          )}

          {isFailed && (
            <div className="flex flex-col items-center gap-2 py-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-center text-sm font-medium">{t(`${ns}.exportFailed`)}</p>
            </div>
          )}
        </div>

        {busy && <FileOpConnectionHint connectionState={api.connectionState} />}
        {busy && (
          <p className="text-center text-xs text-muted-foreground">
            {t('common.safeToClose')}
          </p>
        )}

        <DialogFooter>
          {!busy && !isCompleted && !isFailed && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleExport} disabled={api.isStarting}>
                <Download className="mr-2 h-4 w-4" />
                {t(`${ns}.exportBtn`)}
              </Button>
            </>
          )}

          {busy && (
            <Button variant="outline" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t(`${ns}.exporting`)}
            </Button>
          )}

          {isCompleted && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.close')}
            </Button>
          )}

          {isFailed && (
            <>
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('common.retry')}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.close')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
