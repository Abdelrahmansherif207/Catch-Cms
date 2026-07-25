import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useExportProducts } from '../hooks/use-products';

interface ProductExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductExportDialog({ open, onOpenChange }: ProductExportDialogProps) {
  const { t } = useTranslation();
  const exportMutation = useExportProducts();

  const handleExport = () => {
    exportMutation.mutate(undefined, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('products.exportDialogTitle')}</DialogTitle>
          <DialogDescription>{t('products.exportDialogDesc')}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exportMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? (
              <>{t('common.loading')}</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t('products.exportBtn')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
