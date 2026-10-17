import { useMemo, useState } from 'react';
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
import { useProductPlacements } from '@/features/inventory/hooks/use-inventory';
import type { FulfillmentItem } from '../types/fulfillment.types';

interface AssignPlacementDialogProps {
  item: FulfillmentItem;
  /** Narrows the placement list to the fulfillment's warehouse (globals). */
  warehouseId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Pins a fulfillment item to a placement row. The picker sources the
 * product's OWN multi-location read model
 * (GET /admin/products/{id}/placements): every row IS a product_locations
 * row, so its `id` is exactly the `product_location_id` the engine
 * expects — no more casting a warehouse location id into a placement id.
 * Variant items narrow the list with `?product_variant_id`; scoped
 * callers are forced to their home warehouse server-side, while global
 * holders get the optional `?warehouse_id` narrow.
 * Empty placements are still 200 — the assign must be blocked client-side
 * (the engine would reject any guessed id with a live 422).
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

  const placementsQuery = useProductPlacements(
    item.product_id,
    {
      product_variant_id: item.product_variant_id ?? undefined,
      warehouse_id: warehouseId,
    },
    open
  );

  const header = placementsQuery.data?.data.product ?? null;
  const placements = useMemo(
    () => placementsQuery.data?.data.placements ?? [],
    [placementsQuery.data]
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
          // Resolve FIRST, then close: the task-flow gate distinguishes
          // "assigned" from "cancelled" by this ordering.
          onSuccess();
          onOpenChange(false);
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
  const loading = placementsQuery.isLoading;

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
          {/* Variant awareness — the row's SKU identity drives the fetch
              (?product_variant_id) and the placement rows differ per SKU;
              making it explicit prevents pinning the wrong SKU's bin. */}
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

          {header && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span>{t('fulfillments.placementAuthority')}:</span>
              <span className="font-mono">{header.stock_quantity}</span>
              <span>· {t('fulfillments.placementReserved')}:</span>
              <span className="font-mono">{header.reserved_quantity}</span>
              <span>· {t('fulfillments.placementAvailable')}:</span>
              <span className="font-mono text-success">{header.available_quantity}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t('fulfillments.placementSelect')}</Label>
            <Select
              value={selectedId}
              onValueChange={(v) => {
                if (v !== null) {
                  setSelectedId(v);
                  setServerError(undefined);
                }
              }}
              disabled={loading || placements.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loading
                      ? t('common.loading')
                      : placements.length === 0
                        ? t('fulfillments.placementNone')
                        : t('fulfillments.placementSelect')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {placements.map((row) => (
                  <SelectItem key={row.id} value={String(row.id)}>
                    <span className="font-mono">{row.location_code ?? '#' + row.location_id}</span>
                    <span className="text-muted-foreground"> · {row.sku}</span>
                    {(row.variant_attributes ?? []).map((attr, index) => (
                      <span
                        key={index}
                        className="text-xs text-muted-foreground"
                      >
                        {' '}
                        · {attr.attribute}: {attr.value}
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {' '}
                      · {t('fulfillments.placementQuantity')} {row.quantity}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('fulfillments.placementHint')}</p>
            {placementsQuery.isError && (
              <p className="text-xs text-destructive">
                {t('fulfillments.placementLoadError')}
              </p>
            )}
          </div>
          {serverError && <p className="text-xs text-destructive">{serverError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={pending || placements.length === 0}
          >
            {pending ? t('fulfillments.placementSaving') : t('fulfillments.placementAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
