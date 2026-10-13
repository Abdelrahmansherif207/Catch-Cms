import { useTranslation } from 'react-i18next';
import { Archive } from 'lucide-react';
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
import { useArchiveWarehouse } from '../hooks/use-warehouses';

interface WarehouseArchiveDialogProps {
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchived?: () => void;
}

/**
 * Soft delete: the row is ARCHIVED (hidden), not permanently removed —
 * there is NO restore endpoint, so the wording mirrors the backend's
 * "Warehouse archived successfully." outcome.
 */
export function WarehouseArchiveDialog({
  warehouseId,
  warehouseName,
  warehouseCode,
  open,
  onOpenChange,
  onArchived,
}: WarehouseArchiveDialogProps) {
  const { t } = useTranslation();
  const archiveMutation = useArchiveWarehouse();

  const handleArchive = () => {
    archiveMutation.mutate(warehouseId, {
      onSuccess: () => {
        onOpenChange(false);
        onArchived?.();
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('warehouses.archiveTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('warehouses.archiveConfirm')} <strong>{warehouseName}</strong>{' '}
            <span className="text-muted-foreground">({warehouseCode})</span>?
            <span className="mt-2 block">{t('warehouses.archiveWarning')}</span>
            <span className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Archive className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('warehouses.archiveNoRestore')}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={archiveMutation.isPending}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <Button variant="destructive" onClick={handleArchive} disabled={archiveMutation.isPending}>
            {archiveMutation.isPending ? t('warehouses.archiving') : t('warehouses.archive')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
