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
import { useDeleteBanner } from '../hooks/use-banners';

interface BannerDeleteDialogProps {
  bannerId: number;
  bannerTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function BannerDeleteDialog({
  bannerId,
  bannerTitle,
  open,
  onOpenChange,
  onDeleted,
}: BannerDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteBanner();

  const handleDelete = () => {
    deleteMutation.mutate(bannerId, {
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
          <DialogTitle>{t('banners.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('banners.deleteConfirm')} <strong>{bannerTitle}</strong>?
            {t('banners.deleteWarning')}
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
            {deleteMutation.isPending ? t('banners.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
