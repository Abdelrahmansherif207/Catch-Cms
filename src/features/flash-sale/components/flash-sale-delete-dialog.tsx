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
import { useDeleteFlashSale } from '../hooks/use-flash-sale';

interface FlashSaleDeleteDialogProps {
  flashSaleId: number;
  flashSaleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function FlashSaleDeleteDialog({
  flashSaleId,
  flashSaleTitle,
  open,
  onOpenChange,
  onDeleted,
}: FlashSaleDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteFlashSale();

  const handleDelete = () => {
    deleteMutation.mutate(flashSaleId, {
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
          <DialogTitle>{t('flashSale.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('flashSale.deleteConfirm')} <strong>{flashSaleTitle}</strong>?
            {t('flashSale.deleteWarning')}
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
            {deleteMutation.isPending ? t('flashSale.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
