import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useProductPlacements } from '@/features/inventory/hooks/use-inventory';
import { AssignPlacementDialog } from './assign-placement-dialog';
import { ReceiveStockForPlacementDialog } from './receive-stock-for-placement-dialog';
import type { FulfillmentItem } from '../types/fulfillment.types';

interface PlacementTaskGateProps {
  item: FulfillmentItem;
  warehouseId?: number;
  /** One item fully placed → drop it from the queue (+ create-tasks on drain). */
  onResolved: (itemId: number) => void;
  /** Cancel/dead-end → clear the whole queue (no auto create-tasks). */
  onDismiss: () => void;
}

/**
 * Placement-aware create-tasks gate. Mounted only while the orchestration
 * queue is actively resolving ONE item (remounts per item via the parent's
 * `key`). Fetches the product's placements (GET /products/{id}/placements)
 * and branches:
 * - placements exist → the existing manual AssignPlacementDialog
 * - placements empty AND the caller holds inventory-adjust → the inline
 *   receive-stock dialog (receipt creates the placement + auto-pins it)
 * - placements empty WITHOUT that permission → dead-end hint
 * Resolution order contract: the inner dialogs call onSuccess() BEFORE
 * their own close's onOpenChange(false), so the gate's resolvedRef already
 * reads "assigned" when the close lands — a cancel (no onSuccess) dismisses.
 */
export function PlacementTaskGate({
  item,
  warehouseId,
  onResolved,
  onDismiss,
}: PlacementTaskGateProps) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const resolvedRef = useRef(false);
  // Render-suppression once resolved: without it the still-stale (unplaced)
  // detail row would reopen the dialog for a beat while the refetch lands.
  const [resolved, setResolved] = useState(false);

  const placementsQuery = useProductPlacements(item.product_id, {
    product_variant_id: item.product_variant_id ?? undefined,
    warehouse_id: warehouseId,
  });

  if (placementsQuery.isLoading) return null;
  if (resolved) return null;

  const placements = placementsQuery.data?.data.placements ?? [];

  const handleSuccess = () => {
    resolvedRef.current = true;
    setResolved(true);
    onResolved(item.id);
  };
  const handleOpenChange = (open: boolean) => {
    if (!open && !resolvedRef.current) onDismiss();
  };

  if (placements.length > 0) {
    return (
      <AssignPlacementDialog
        item={item}
        warehouseId={warehouseId}
        open
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    );
  }

  if (can(PERMISSIONS.inventory.adjust)) {
    return (
      <ReceiveStockForPlacementDialog
        item={item}
        warehouseId={warehouseId}
        open
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {t('fulfillments.placementTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('fulfillments.receiveStock.permissionHint', {
              item: item.id,
              product: item.product_id,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onDismiss()}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
