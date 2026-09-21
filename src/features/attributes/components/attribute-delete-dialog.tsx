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
import { useDeleteAttribute } from '../hooks/use-attributes';

interface AttributeDeleteDialogProps {
  attributeId: number;
  attributeName: string;
  valuesCount?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function AttributeDeleteDialog({
  attributeId,
  attributeName,
  valuesCount,
  open,
  onOpenChange,
  onDeleted,
}: AttributeDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteAttribute();

  const handleDelete = () => {
    deleteMutation.mutate(attributeId, {
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
          <DialogTitle>{t('attributes.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('attributes.deleteConfirm')} <strong>{attributeName}</strong>?
          </DialogDescription>
        </DialogHeader>

        {valuesCount && valuesCount > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <p className="text-sm text-warning">
              {t('attributes.deleteCascadeWarning', { count: valuesCount })}
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
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('attributes.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
