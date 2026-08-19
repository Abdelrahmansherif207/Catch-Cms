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
import { useDeleteTag } from '../hooks/use-tags';

interface TagDeleteDialogProps {
  tagId: number;
  tagName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function TagDeleteDialog({
  tagId,
  tagName,
  open,
  onOpenChange,
  onDeleted,
}: TagDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteTag();

  const handleDelete = () => {
    deleteMutation.mutate(tagId, {
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
          <DialogTitle>{t('tags.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('tags.deleteConfirm')} <strong>{tagName}</strong>?
            {t('tags.deleteWarning')}
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
            {deleteMutation.isPending ? t('tags.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
