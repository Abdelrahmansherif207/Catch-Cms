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
import { useForceDeleteUser } from '../hooks/use-users';

interface UserForceDeleteDialogProps {
  userId: number;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function UserForceDeleteDialog({
  userId,
  userName,
  open,
  onOpenChange,
  onDeleted,
}: UserForceDeleteDialogProps) {
  const { t } = useTranslation();
  const forceDeleteMutation = useForceDeleteUser();

  const handleDelete = () => {
    forceDeleteMutation.mutate(userId, {
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
          <DialogTitle>{t('users.forceDeleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('users.forceDeleteConfirm')} <strong>{userName}</strong>?
            {t('users.forceDeleteWarning')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={forceDeleteMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={forceDeleteMutation.isPending}
          >
            {forceDeleteMutation.isPending ? t('users.deleting') : t('users.forceDelete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
