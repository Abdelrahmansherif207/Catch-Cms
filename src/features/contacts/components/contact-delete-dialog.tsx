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
import { useDeleteContact } from '../hooks/use-contacts';

interface ContactDeleteDialogProps {
  contactId: number;
  contactEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function ContactDeleteDialog({
  contactId,
  contactEmail,
  open,
  onOpenChange,
  onDeleted,
}: ContactDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteContact();

  const handleDelete = () => {
    deleteMutation.mutate(contactId, {
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
          <DialogTitle>{t('contacts.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('contacts.deleteConfirm')} <strong>{contactEmail}</strong>?
            {t('contacts.deleteWarning')}
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
            {deleteMutation.isPending ? t('contacts.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
