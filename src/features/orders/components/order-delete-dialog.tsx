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
import { useDeleteOrder } from '../hooks/use-orders';

interface OrderDeleteDialogProps {
  orderId: number;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function OrderDeleteDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
  onDeleted,
}: OrderDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteOrder();

  const handleDelete = () => {
    deleteMutation.mutate(orderId, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('orders.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('orders.deleteDescription', { orderNumber })}
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
            {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
