import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useCategoriesExport } from '../hooks/use-categories';

interface CategoryExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryExportDialog({ open, onOpenChange }: CategoryExportDialogProps) {
  const { t } = useTranslation();
  const exportApi = useCategoriesExport();

  const busy = exportApi.phase === 'starting' || exportApi.phase === 'polling';

  useEffect(() => {
    if (exportApi.phase === 'completed') {
      onOpenChange(false);
    }
  }, [exportApi.phase]);

  const handleOpenChange = (
    open: boolean,
    details?: { cancel: () => void; reason?: string }
  ) => {
    if (open) {
      if (!busy) {
        exportApi.reset();
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

  const handleExport = () => {
    exportApi.start();
  };

  const showError = exportApi.phase === 'failed' || exportApi.phase === 'timeout';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {busy
              ? t('categories.exportProcessing')
              : showError
                ? t('categories.exportFailed')
                : t('categories.exportDialogTitle')}
          </DialogTitle>
          <DialogDescription>
            {busy
              ? t('categories.exportProcessingSubtitle')
              : showError
                ? ''
                : t('categories.exportDialogDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {busy && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm font-medium">{t('categories.exporting')}</p>
              {exportApi.status && exportApi.status.processed_rows > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('categories.processedRows')}: {exportApi.status.processed_rows}
                  {exportApi.status.total_rows > 0
                    ? ` / ${exportApi.status.total_rows}`
                    : ''}
                </p>
              )}
            </div>
          )}

          {(exportApi.phase === 'failed' || exportApi.phase === 'timeout') && (
            <div className="flex flex-col items-center gap-2 py-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm font-medium text-center">
                {exportApi.phase === 'timeout'
                  ? t('categories.exportTimeout')
                  : t('categories.exportFailed')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!busy && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                {t('categories.exportBtn')}
              </Button>
            </>
          )}

          {busy && (
            <Button variant="outline" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('categories.exporting')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
