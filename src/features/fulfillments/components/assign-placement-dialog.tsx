import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  itemProgress,
  normalizeQuantity,
} from '../schemas/release.schema';
import { useAssignItemPlacement } from '../hooks/use-fulfillments';
import { fetchLocations } from '../api/locations.api';
import type { FulfillmentItem } from '../types/fulfillment.types';

interface AssignPlacementDialogProps {
  item: FulfillmentItem;
  /** Filter visible locations to the fulfillment's warehouse. */
  warehouseId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Pins a fulfillment item to a placement row. The picker sources
 * `/admin/locations` (physical locations — configured and verified live);
 * the chosen id is sent as `product_location_id`. If the engine rejects
 * the id upstream, the live 422 text surfaces inside this dialog verbatim,
 * so the mismatch is observable instead of silent.
 */
export function AssignPlacementDialog({
  item,
  warehouseId,
  open,
  onOpenChange,
  onSuccess,
}: AssignPlacementDialogProps) {
  const { t } = useTranslation();
  const assignMutation = useAssignItemPlacement();
  const [selectedId, setSelectedId] = useState('');
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const { data: locationsResponse } = useQuery({
    queryKey: ['locations', 'packing-picker', { limit: 100 }],
    queryFn: () => fetchLocations({ limit: 100 }),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const locations = useMemo(
    () =>
      (locationsResponse?.data ?? []).filter(
        (location) =>
          location.status === 'active' &&
          (warehouseId ? location.warehouse_id === warehouseId : true)
      ),
    [locationsResponse, warehouseId]
  );

  // NB: gated render — parent mounts this only while placementItem exists,
  // so the selection resets naturally (react-hooks rule).
  if (!open) return null;

  const { picked, total } = itemProgress(item);

  const handleAssign = () => {
    if (!selectedId) {
      setServerError(t('fulfillments.placementRequired'));
      return;
    }
    assignMutation.mutate(
      { itemId: item.id, payload: { product_location_id: Number(selectedId) } },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess();
        },
        onError: (error) => {
          const apiError = error as {
            status?: number;
            message?: string;
            errors?: Record<string, string[]>;
          };
          if (apiError?.status === 422 && apiError.errors) {
            setServerError(apiError.errors['product_location_id']?.[0] ?? apiError.message);
          } else if (apiError?.status === 422) {
            // Engine refusal (wrong-product) is a map-less live 422.
            setServerError(apiError.message);
          }
        },
      }
    );
  };

  const pending = assignMutation.isPending;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('fulfillments.placementTitle')}</DialogTitle>
          <DialogDescription>
            {t('fulfillments.placementDescription', {
              item: item.id,
              product: item.product_id,
              progress: normalizeQuantity(picked) + '/' + normalizeQuantity(total),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t('fulfillments.placementSelect')}</Label>
            <Select value={selectedId} onValueChange={(v) => { if (v !== null) setSelectedId(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('fulfillments.placementSelect')} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={String(location.id)}>
                    {location.name} ({location.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('fulfillments.placementHint')}
            </p>
          </div>
          {serverError && <p className="text-xs text-destructive">{serverError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleAssign} disabled={pending}>
            {pending ? t('fulfillments.placementSaving') : t('fulfillments.placementAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
