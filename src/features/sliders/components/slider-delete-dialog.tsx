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
import { useDeleteSlider } from '../hooks/use-sliders';

interface SliderDeleteDialogProps {
  sliderId: number;
  sliderTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function SliderDeleteDialog({
  sliderId,
  sliderTitle,
  open,
  onOpenChange,
  onDeleted,
}: SliderDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteSlider();

  const handleDelete = () => {
    deleteMutation.mutate(sliderId, {
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
          <DialogTitle>{t('sliders.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('sliders.deleteConfirm')} <strong>{sliderTitle}</strong>?
            {t('sliders.deleteWarning')}
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
            {deleteMutation.isPending ? t('sliders.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
