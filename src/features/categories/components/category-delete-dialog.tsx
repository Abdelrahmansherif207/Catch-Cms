import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useDeleteCategory } from '../hooks/use-categories';

interface CategoryDeleteDialogProps {
  categoryId: number;
  categoryName: string;
  hasChildren?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function CategoryDeleteDialog({
  categoryId,
  categoryName,
  hasChildren,
  open,
  onOpenChange,
  onDeleted,
}: CategoryDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteCategory();

  const handleDelete = () => {
    deleteMutation.mutate(categoryId, {
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
          <DialogTitle>{t('categories.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('categories.deleteConfirm')} <strong>{categoryName}</strong>?
          </DialogDescription>
        </DialogHeader>

        {hasChildren && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/20">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {t('categories.childrenWarning')}
            </p>
          </div>
        )}

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
            disabled={deleteMutation.isPending || hasChildren}
          >
            {deleteMutation.isPending ? t('categories.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
