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
import { useRestoreUser } from '../hooks/use-users';

interface UserRestoreDialogProps {
  userId: number;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored: () => void;
}

export function UserRestoreDialog({
  userId,
  userName,
  open,
  onOpenChange,
  onRestored,
}: UserRestoreDialogProps) {
  const { t } = useTranslation();
  const restoreMutation = useRestoreUser();

  const handleRestore = () => {
    restoreMutation.mutate(userId, {
      onSuccess: () => {
        onRestored();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.restoreTitle')}</DialogTitle>
          <DialogDescription>
            {t('users.restoreConfirm')} <strong>{userName}</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={restoreMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleRestore}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? t('users.restoring') : t('users.restore')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
