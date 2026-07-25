import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useDeleteProduct } from '../hooks/use-products';

interface ProductDeleteDialogProps {
  productId: number;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function ProductDeleteDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onDeleted,
}: ProductDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteProduct();

  const handleDelete = () => {
    deleteMutation.mutate(productId, {
      onSuccess: () => {
        onDeleted();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('products.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('products.deleteConfirm')} <strong>{productName}</strong>?
            {t('products.deleteWarning')}
          </DialogDescription>
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
            {deleteMutation.isPending ? t('products.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
