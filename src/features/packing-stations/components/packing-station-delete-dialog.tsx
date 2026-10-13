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
import { useDeletePackingStation } from '../hooks/use-packing-stations';

interface PackingStationDeleteDialogProps {
  stationId: number;
  stationName: string;
  stationCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function PackingStationDeleteDialog({
  stationId,
  stationName,
  stationCode,
  open,
  onOpenChange,
  onDeleted,
}: PackingStationDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeletePackingStation();

  const handleDelete = () => {
    deleteMutation.mutate(stationId, {
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
          <AlertDialogTitle>{t('packingStations.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('packingStations.deleteConfirm')}{' '}
            <strong>{stationName}</strong> ({stationCode})?
            {t('packingStations.deleteWarning')}
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
            {deleteMutation.isPending ? t('packingStations.deleting') : t('common.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
