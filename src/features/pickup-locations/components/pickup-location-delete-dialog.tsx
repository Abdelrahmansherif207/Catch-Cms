import { useTranslation } from 'react-i18next';
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
import { useDeletePickupLocation } from '../hooks/use-pickup-locations';

interface PickupLocationDeleteDialogProps {
  locationId: number;
  locationName: string;
  isDefault?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function PickupLocationDeleteDialog({
  locationId,
  locationName,
  isDefault = false,
  open,
  onOpenChange,
  onDeleted,
}: PickupLocationDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeletePickupLocation();

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
          <AlertDialogTitle>{t('pickupLocations.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('pickupLocations.deleteConfirm')} <strong>{locationName}</strong>?
            {t('pickupLocations.deleteWarning')}
            {isDefault && (
              <span className="mt-2 block text-destructive">
                {t('pickupLocations.defaultDeleteWarning')}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('pickupLocations.deleting') : t('common.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
