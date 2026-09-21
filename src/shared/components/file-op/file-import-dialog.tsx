import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  FileSpreadsheet,
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Ban,
  RotateCcw,
} from 'lucide-react';
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

export type FileImportResource = 'brands' | 'categories' | 'products';

export interface FileImportStatus {
  status: string;
  progress?: number | null;
  total_rows?: number | null;
  processed_rows?: number | null;
  successful_rows?: number | null;
  success_rows?: number | null;
  failed_rows?: number | null;
}

export interface FileImportApi {
  upload: (file: File) => void;
  isUploading: boolean;
  phase: string;
  importId: number | null;
  status: FileImportStatus | null;
  connectionState?: FileOperationConnectionState;
  cancel: () => void;
  isCancelling: boolean;
  downloadErrors: () => void;
  downloadSample: () => void;
  reset: () => void;
}

interface FileImportDialogProps {
  ns: FileImportResource;
  api: FileImportApi;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.ods'];

/**
 * Single production import dialog for brands/categories/products.
 * Fully event-driven: `uploading` (file POST) → `processing` (Pusher
 * `queued`/`progress`/terminal events) → terminal result. No timers.
 */
export function FileImportDialog({ ns, api, open, onOpenChange }: FileImportDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const busy = api.phase === 'uploading' || api.phase === 'processing';
  const isProcessing = api.phase === 'processing';
  const isQueued =
    isProcessing && (api.status == null || api.status.status === 'pending');
  const showResult =
    api.phase === 'completed' ||
    api.phase === 'completed_with_errors' ||
    api.phase === 'failed' ||
    api.phase === 'cancelled';
  const isCancellingStatus = api.status?.status === 'cancelling';
  const hasErrors =
    api.phase === 'completed_with_errors' ||
    (api.phase === 'completed' && (api.status?.failed_rows ?? 0) > 0);
  const isFailed = api.phase === 'failed';
  const isCancelled = api.phase === 'cancelled';

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (busy) return;
      const lower = file.name.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
        setSelectedFile(null);
        setFileError(t('common.invalidFileType'));
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setSelectedFile(null);
        setFileError(t('common.fileTooLarge'));
        return;
      }
      setFileError(null);
      setSelectedFile(file);
    },
    [busy, t],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleImport = () => {
    if (!selectedFile || api.isUploading || api.phase !== 'idle') return;
    api.upload(selectedFile);
  };

  const handleStartNew = () => {
    clearFile();
    api.reset();
  };

  const handleOpenChange = (
    next: boolean,
    details?: { cancel: () => void; reason?: string },
  ) => {
    if (next) {
      if (!busy) {
        clearFile();
        api.reset();
      }
      onOpenChange(true);
      return;
    }
    // X always closes (jobs survive on the server); block only accidental
    // outside-press / escape while a job is running.
    if (
      busy &&
      (details?.reason === 'outside-press' || details?.reason === 'escape-key')
    ) {
      details.cancel();
      return;
    }
    onOpenChange(false);
  };

  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(1)} KB`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isProcessing && !isQueued
              ? t(`${ns}.importProcessing`)
              : isQueued
                ? t(`${ns}.importProcessing`)
                : showResult
                  ? t(`${ns}.importResult`)
                  : t(`${ns}.importTitle`)}
          </DialogTitle>
          <DialogDescription>
            {isQueued
              ? t('common.queuedSubtitle')
              : isProcessing
                ? t(`${ns}.importProcessingSubtitle`)
                : showResult
                  ? ''
                  : t(`${ns}.importSubtitle`)}
          </DialogDescription>
        </DialogHeader>

        {(busy || showResult) && (
          <div className="flex items-center justify-center">
            <FileOpBadge
              state={api.status?.status ?? 'pending'}
              hasErrors={hasErrors}
              live={api.connectionState === 'live' || api.connectionState === undefined}
            />
          </div>
        )}

        <div className="space-y-4">
          {isProcessing && api.status && !isQueued && (
            <FileOpProgress
              progress={api.status.progress}
              processed={api.status.processed_rows}
              total={api.status.total_rows}
              success={api.status.successful_rows ?? api.status.success_rows}
              failed={api.status.failed_rows}
              successLabel={t(`${ns}.successRows`)}
            />
          )}

          {isQueued && (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('common.queuedSubtitle')}</p>
            </div>
          )}

          {showResult && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-2">
                {isFailed || isCancelled || hasErrors ? (
                  <AlertCircle className="h-10 w-10 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-success" />
                )}
                <p className="text-center text-sm font-medium">
                  {isFailed
                    ? t(`${ns}.importFailed`)
                    : isCancelled
                      ? t(`${ns}.importCancelled`)
                      : hasErrors
                        ? t(`${ns}.importCompletedWithErrors`)
                        : t(`${ns}.importCompleted`)}
                </p>
              </div>

              {api.status && !isCancelled && !isFailed && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border bg-card p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{t(`${ns}.totalRows`)}</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">
                      {api.status.total_rows || 0}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{t(`${ns}.successRows`)}</p>
                    <p className="mt-0.5 text-lg font-semibold text-success tabular-nums">
                      {api.status.successful_rows ?? api.status.success_rows ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{t(`${ns}.failedRows`)}</p>
                    <p
                      className={`mt-0.5 text-lg font-semibold tabular-nums ${(api.status.failed_rows ?? 0) > 0 ? 'text-destructive' : ''}`}
                    >
                      {api.status.failed_rows || 0}
                    </p>
                  </div>
                </div>
              )}

              {hasErrors && (
                <Button variant="outline" className="w-full" onClick={api.downloadErrors}>
                  <Download className="me-2 h-4 w-4" />
                  {t(`${ns}.downloadErrors`)}
                </Button>
              )}
            </div>
          )}

          {api.phase === 'idle' && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                  fileError
                    ? 'border-destructive/60 bg-destructive/5'
                    : dragOver
                      ? 'border-primary bg-primary/5'
                      : selectedFile
                        ? 'border-success bg-success/5'
                        : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-success" />
                    <div className="text-sm">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-muted-foreground">{formatSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">{t(`${ns}.selectFile`)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`${ns}.dragDropHint`)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('common.fileRequirements')}
                    </p>
                  </>
                )}
              </div>

              {fileError && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {fileError}
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.ods"
                onChange={handleInputChange}
                className="hidden"
              />

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  api.downloadSample();
                }}
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5" />
                {t(`${ns}.downloadSample`)}
              </a>
            </>
          )}

          {api.phase === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm font-medium">{t(`${ns}.uploading`)}</p>
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
          {api.phase === 'idle' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || api.isUploading}
              >
                <Upload className="me-2 h-4 w-4" />
                {t(`${ns}.importBtn`)}
              </Button>
            </>
          )}

          {busy && (
            <>
              {isProcessing && (
                <Button
                  variant="outline"
                  onClick={api.cancel}
                  disabled={api.isCancelling || isCancellingStatus}
                >
                  {api.isCancelling || isCancellingStatus ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {t(`${ns}.cancelling`)}
                    </>
                  ) : (
                    <>
                      <Ban className="me-2 h-4 w-4" />
                      {t(`${ns}.cancelImport`)}
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" disabled>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t(`${ns}.importing`)}
              </Button>
            </>
          )}

          {showResult && (
            <>
              <Button variant="outline" onClick={handleStartNew}>
                <RotateCcw className="me-2 h-4 w-4" />
                {t('common.startNew')}
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
