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
import { useDeleteCoupon } from '../hooks/use-coupons';

interface CouponDeleteDialogProps {
  couponId: number;
  couponCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function CouponDeleteDialog({
  couponId,
  couponCode,
  open,
  onOpenChange,
  onDeleted,
}: CouponDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteCoupon();

  const handleDelete = () => {
    deleteMutation.mutate(couponId, {
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
          <DialogTitle>{t('coupons.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('coupons.deleteConfirm')} <strong>{couponCode}</strong>?
            {t('coupons.deleteWarning')}
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
            {deleteMutation.isPending ? t('coupons.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
