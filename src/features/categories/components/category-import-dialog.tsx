import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  FileSpreadsheet,
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Ban,
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
import { useCategoriesImport, type CategoryImportPhase } from '../hooks/use-categories';

interface CategoryImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryImportDialog({ open, onOpenChange }: CategoryImportDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const importApi = useCategoriesImport();

  useEffect(() => {
    if (importApi.phase === 'cancelled') {
      onOpenChange(false);
    }
  }, [importApi.phase]);

  const handleFileSelect = useCallback((file: File) => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.ods')) {
      setSelectedFile(file);
    }
  }, []);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = () => {
    if (!selectedFile) return;
    importApi.upload(selectedFile);
  };

  const busy = importApi.phase === 'uploading' || importApi.phase === 'polling';

  const handleOpenChange = (
    open: boolean,
    details?: { cancel: () => void; reason?: string }
  ) => {
    if (open) {
      const inFlight = busy;
      if (!inFlight) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        importApi.reset();
      }
      onOpenChange(true);
      return;
    }

    if (
      busy &&
      (details?.reason === 'outside-press' || details?.reason === 'escape-key')
    ) {
      details.cancel();
      return;
    }
    onOpenChange(false);
  };

  const isProcessing = importApi.phase === 'polling';
  const showResult =
    importApi.phase === 'completed' ||
    importApi.phase === 'completed_with_errors' ||
    importApi.phase === 'failed' ||
    importApi.phase === 'cancelled' ||
    importApi.phase === 'timeout';
  const isCancellingStatus = importApi.status?.status === 'cancelling';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isProcessing
              ? t('categories.importProcessing')
              : showResult
                ? t('categories.importResult')
                : t('categories.importTitle')}
          </DialogTitle>
          <DialogDescription>
            {isProcessing
              ? t('categories.importProcessingSubtitle')
              : showResult
                ? ''
                : t('categories.importSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Phase: Progress */}
          {isProcessing && importApi.status && (
            <ProcessingPhase status={importApi.status} />
          )}

          {/* Phase: Result */}
          {showResult && (
            <ResultPhase
              phase={importApi.phase}
              status={importApi.status}
              onDownloadErrors={importApi.downloadErrors}
            />
          )}

          {/* Phase: Select File (default) */}
          {importApi.phase === 'idle' && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                  dragOver
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
                      <p className="text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">{t('categories.selectFile')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('categories.dragDropHint')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('categories.supportedFormats')}
                    </p>
                  </>
                )}
              </div>

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
                  importApi.downloadSample();
                }}
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                {t('categories.downloadSample')}
              </a>
            </>
          )}

          {/* Phase: Uploading spinner */}
          {importApi.phase === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm font-medium">{t('categories.uploading')}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {importApi.phase === 'idle' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleImport} disabled={!selectedFile}>
                <Upload className="mr-2 h-4 w-4" />
                {t('categories.importBtn')}
              </Button>
            </>
          )}

          {busy && (
            <>
              {isProcessing && (
                <Button
                  variant="outline"
                  onClick={() => importApi.cancel()}
                  disabled={importApi.isCancelling || isCancellingStatus}
                >
                  {importApi.isCancelling || isCancellingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('categories.cancelling')}
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      {t('categories.cancelImport')}
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('categories.importing')}
              </Button>
            </>
          )}

          {showResult && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProcessingPhase({
  status,
}: {
  status: { progress: number; total_rows: number; processed_rows: number; successful_rows: number; failed_rows: number };
}) {
  const { t } = useTranslation();
  const progress = Math.min(status.progress ?? 0, 100);
  const total = status.total_rows || 0;
  const processed = status.processed_rows || 0;

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('categories.progress')}</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('categories.processedRows')}</p>
          <p className="mt-0.5 text-lg font-semibold">
            {processed} / {total || '?'}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('categories.successRows')}</p>
          <p className="mt-0.5 text-lg font-semibold text-green-600">
            {status.successful_rows || 0}
          </p>
        </div>
      </div>

      {status.failed_rows > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('categories.failedRows')}</p>
          <p className="mt-0.5 text-lg font-semibold text-destructive">
            {status.failed_rows}
          </p>
        </div>
      )}
    </div>
  );
}

function ResultPhase({
  phase,
  status,
  onDownloadErrors,
}: {
  phase: CategoryImportPhase;
  status: { total_rows: number; successful_rows: number; failed_rows: number } | null;
  onDownloadErrors: () => void;
}) {
  const { t } = useTranslation();

  const isTimeout = phase === 'timeout';
  const isFailed = phase === 'failed';
  const isCancelled = phase === 'cancelled';
  const hasErrors =
    phase === 'completed_with_errors' ||
    (phase === 'completed' && (status?.failed_rows ?? 0) > 0);

  const Icon = isTimeout
    ? Clock
    : isFailed || isCancelled || hasErrors
      ? AlertCircle
      : CheckCircle2;
  const iconColor =
    isTimeout || isFailed || isCancelled || hasErrors ? 'text-destructive' : 'text-green-500';

  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-col items-center gap-2">
        <Icon className={`h-10 w-10 ${iconColor}`} />
        <p className="text-sm font-medium text-center">
          {isTimeout
            ? t('categories.importTimeout')
            : isFailed
              ? t('categories.importFailed')
              : isCancelled
                ? t('categories.importCancelled')
                : hasErrors
                  ? t('categories.importCompletedWithErrors')
                  : t('categories.importCompleted')}
        </p>
      </div>

      {status && !isCancelled && !isFailed && !isTimeout && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-card p-2.5 text-center">
            <p className="text-xs text-muted-foreground">{t('categories.totalRows')}</p>
            <p className="mt-0.5 text-lg font-semibold">{status.total_rows || 0}</p>
          </div>
          <div className="rounded-lg border bg-card p-2.5 text-center">
            <p className="text-xs text-muted-foreground">{t('categories.successRows')}</p>
            <p className="mt-0.5 text-lg font-semibold text-green-600">
              {status.successful_rows || 0}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-2.5 text-center">
            <p className="text-xs text-muted-foreground">{t('categories.failedRows')}</p>
            <p
              className={`mt-0.5 text-lg font-semibold ${status.failed_rows > 0 ? 'text-destructive' : ''}`}
            >
              {status.failed_rows || 0}
            </p>
          </div>
        </div>
      )}

      {hasErrors && (
        <Button variant="outline" className="w-full" onClick={onDownloadErrors}>
          <Download className="mr-2 h-4 w-4" />
          {t('categories.downloadErrors')}
        </Button>
      )}
    </div>
  );
}
