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
import { useDeleteBrand } from '../hooks/use-brands';

interface BrandDeleteDialogProps {
  brandId: number;
  brandName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function BrandDeleteDialog({
  brandId,
  brandName,
  open,
  onOpenChange,
  onDeleted,
}: BrandDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteBrand();

  const handleDelete = () => {
    deleteMutation.mutate(brandId, {
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
          <DialogTitle>{t('brands.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('brands.deleteConfirm')} <strong>{brandName}</strong>?
            {t('brands.deleteWarning')}
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
            {deleteMutation.isPending ? t('brands.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
