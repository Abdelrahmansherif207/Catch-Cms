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
import { useDeletePromotion } from '../hooks/use-promotions';

interface PromotionDeleteDialogProps {
  promotionId: number;
  promotionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function PromotionDeleteDialog({
  promotionId,
  promotionName,
  open,
  onOpenChange,
  onDeleted,
}: PromotionDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeletePromotion();

  const handleDelete = () => {
    deleteMutation.mutate(promotionId, {
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
          <DialogTitle>{t('promotions.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('promotions.deleteConfirm')} <strong>{promotionName}</strong>?
            {t('promotions.deleteWarning')}
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
            {deleteMutation.isPending ? t('promotions.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
