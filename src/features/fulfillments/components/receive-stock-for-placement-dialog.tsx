import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackagePlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useLocations } from '@/features/locations/hooks/use-locations';
import { isStockCapableBin } from '@/features/inventory/types/inventory.types';
import { useReceiveStock } from '@/features/inventory/hooks/use-inventory';
import {
  itemProgress,
  normalizeQuantity,
} from '../schemas/release.schema';
import { useAssignItemPlacement } from '../hooks/use-fulfillments';
import type { WarehouseLocation } from '@/features/locations/types/location.types';
import type { FulfillmentItem } from '../types/fulfillment.types';

interface ReceiveStockForPlacementDialogProps {
  item: FulfillmentItem;
  /** Narrows the bin list to the fulfillment's warehouse. */
  warehouseId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/** Deterministic-enough replay key (≤64 chars as the server rule caps). */
function generateIdempotencyKey(): string {
  return `ui-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Breaks the "awaiting placement" deadlock when the product has NO
 * placements at all (zero product_locations rows — stock was never
 * received). One step: pick a stock-capable bin + quantity, POST a stock
 * receipt (which CREATES the placement row), then auto-pin the item to the
 * placement the operation returns (`operation.placement.id` is the exact
 * product_location_id the engine expects).
 */
export function ReceiveStockForPlacementDialog({
  item,
  warehouseId,
  open,
  onOpenChange,
  onSuccess,
}: ReceiveStockForPlacementDialogProps) {
  const { t } = useTranslation();
  const receiveMutation = useReceiveStock();
  const assignMutation = useAssignItemPlacement();
  const [binId, setBinId] = useState('');
  const [quantity, setQuantity] = useState(() => normalizeQuantity(item.quantity) || '1');
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const { data: locationsData } = useLocations({ warehouseId, limit: 100 });

  const bins = useMemo(
    () => (locationsData?.data ?? []).filter((location: WarehouseLocation) =>
      isStockCapableBin(location)
    ),
    [locationsData]
  );

  // NB: gated render — parent mounts this only while the item is active.
  if (!open) return null;

  const { picked, total } = itemProgress(item);

  const handleReceive = () => {
    if (!binId) {
      setServerError(t('fulfillments.receiveStock.binRequired'));
      return;
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setServerError(t('fulfillments.receiveStock.quantityInvalid'));
      return;
    }
    receiveMutation.mutate(
      {
        locationId: Number(binId),
        payload: {
          product_id: item.product_id,
          product_variant_id: item.product_variant_id ?? null,
          quantity: qty,
          reference: null,
          idempotency_key: generateIdempotencyKey(),
        },
      },
      {
        onSuccess: (response) => {
          const placementId = response.data.operation.placement?.id ?? null;
          if (!placementId) {
            setServerError(t('fulfillments.receiveStock.placementMissing'));
            return;
          }
          assignMutation.mutate(
            { itemId: item.id, payload: { product_location_id: placementId } },
            {
              onSuccess: () => {
                // Resolve FIRST, then close — same contract as the assign
                // dialog so the gate can tell assigned from cancelled.
                onSuccess();
                onOpenChange(false);
              },
              onError: (error) => {
                const apiError = error as {
                  status?: number;
                  message?: string;
                  errors?: Record<string, string[]>;
                };
                setServerError(apiError?.message);
              },
            }
          );
        },
        onError: (error) => {
          const apiError = error as {
            status?: number;
            message?: string;
          };
          setServerError(apiError?.message);
        },
      }
    );
  };

  const pending = receiveMutation.isPending || assignMutation.isPending;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            {t('fulfillments.receiveStock.title')}
          </DialogTitle>
          <DialogDescription>
            {t('fulfillments.receiveStock.description', {
              item: item.id,
              product: item.product_id,
              progress: normalizeQuantity(picked) + '/' + normalizeQuantity(total),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Variant awareness — same chip block as the assign dialog: the
              receipt path is PER-SKU via product_variant_id. */}
          {item.variant && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-info-soft/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                {t('fulfillments.placementVariantFor')}:
              </span>
              <span className="rounded-md bg-info-soft px-1.5 py-0.5 font-mono text-info">
                {item.variant.sku}
              </span>
              {item.variant.attributes.map((attr, index) => (
                <span
                  key={index}
                  className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
                >
                  {attr.attribute}: {attr.value}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t('fulfillments.receiveStock.bin')}</Label>
            <Select
              value={binId}
              onValueChange={(value) => {
                if (value !== null) {
                  setBinId(value);
                  setServerError(undefined);
                }
              }}
              disabled={bins.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    bins.length === 0
                      ? t('fulfillments.receiveStock.noBins')
                      : t('fulfillments.receiveStock.binPlaceholder')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {bins.map((bin) => (
                  <SelectItem key={bin.id} value={String(bin.id)}>
                    <span className="font-mono">{bin.code}</span>
                    <span className="text-muted-foreground"> · {bin.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('fulfillments.receiveStock.quantity')}</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setServerError(undefined);
              }}
            />
          </div>

          {serverError && <p className="text-xs text-destructive">{serverError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleReceive} disabled={pending || bins.length === 0}>
            {pending
              ? t('fulfillments.receiveStock.receiving')
              : t('fulfillments.receiveStock.receive')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
