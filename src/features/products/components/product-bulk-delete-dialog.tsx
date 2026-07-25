import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useBulkDeleteProducts } from '../hooks/use-products';

interface ProductBulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onDeleted: () => void;
}

export function ProductBulkDeleteDialog({
  open,
  onOpenChange,
  selectedIds,
  onDeleted,
}: ProductBulkDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useBulkDeleteProducts();

  const handleDelete = () => {
    deleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        onDeleted();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>{t('products.bulkDeleteTitle')}</DialogTitle>
              <DialogDescription>
                {t('products.bulkDeleteDesc', { count: selectedIds.length })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? t('products.deleting')
              : t('products.bulkDeleteBtn', { count: selectedIds.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
