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
import { useDeleteFaq } from '../hooks/use-faqs';

interface FaqDeleteDialogProps {
  faqId: number;
  faqTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function FaqDeleteDialog({
  faqId,
  faqTitle,
  open,
  onOpenChange,
  onDeleted,
}: FaqDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteFaq();

  const handleDelete = () => {
    deleteMutation.mutate(faqId, {
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
          <DialogTitle>{t('faqs.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('faqs.deleteConfirm')} <strong>{faqTitle}</strong>?
            {t('faqs.deleteWarning')}
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
            {deleteMutation.isPending ? t('faqs.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
