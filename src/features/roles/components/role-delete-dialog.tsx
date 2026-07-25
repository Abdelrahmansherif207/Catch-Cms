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
import { useDeleteRole } from '../hooks/use-roles';

interface RoleDeleteDialogProps {
  roleId: number;
  roleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function RoleDeleteDialog({
  roleId,
  roleName,
  open,
  onOpenChange,
  onDeleted,
}: RoleDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteRole();

  const handleDelete = () => {
    deleteMutation.mutate(roleId, {
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
          <DialogTitle>{t('roles.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('roles.deleteConfirm')} <strong>{roleName}</strong>?
            {t('roles.deleteWarning')}
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
            {deleteMutation.isPending ? t('roles.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
