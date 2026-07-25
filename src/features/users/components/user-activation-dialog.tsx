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
import { useToggleActivation } from '../hooks/use-users';

interface UserActivationDialogProps {
  userId: number;
  userName: string;
  currentStatus: boolean | number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: () => void;
}

export function UserActivationDialog({
  userId,
  userName,
  currentStatus,
  open,
  onOpenChange,
  onActivated,
}: UserActivationDialogProps) {
  const { t } = useTranslation();
  const toggleMutation = useToggleActivation();
  const isActive = Boolean(currentStatus);

  const handleToggle = () => {
    toggleMutation.mutate(userId, {
      onSuccess: () => {
        onActivated();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isActive ? t('users.deactivateTitle') : t('users.activateTitle')}
          </DialogTitle>
          <DialogDescription>
            {isActive
              ? t('users.deactivateConfirm', { name: userName })
              : t('users.activateConfirm', { name: userName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={toggleMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant={isActive ? 'destructive' : 'default'}
            onClick={handleToggle}
            disabled={toggleMutation.isPending}
          >
            {toggleMutation.isPending ? t('common.loading') : isActive ? t('users.deactivate') : t('users.activate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
