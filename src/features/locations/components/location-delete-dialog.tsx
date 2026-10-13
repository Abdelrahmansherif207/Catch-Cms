import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { useDeleteLocation } from '../hooks/use-locations';

interface LocationDeleteDialogProps {
  locationId: number;
  locationName: string;
  locationCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/**
 * HARD delete (backend has NO SoftDeletes on locations) — placement records
 * survive only when the bin is empty; guarded rows surface the backend's
 * verbatim 422 literals (children / active stock / open picking tasks).
 * There is NO restore, so the wording mirrors the permanent outcome.
 */
export function LocationDeleteDialog({
  locationId,
  locationName,
  locationCode,
  open,
  onOpenChange,
  onDeleted,
}: LocationDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteLocation();

  const handleDelete = () => {
    deleteMutation.mutate(locationId, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.();
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('locations.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('locations.deleteConfirm')} <strong>{locationName}</strong>{' '}
            <span className="text-muted-foreground">({locationCode})</span>?
            <span className="mt-2 block">{t('locations.deleteWarning')}</span>
            <span className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('locations.deleteNoRestore')}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? t('locations.deleting') : t('locations.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
