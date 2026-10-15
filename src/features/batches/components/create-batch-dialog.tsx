import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Warehouse, Waves } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { DataEmptyState } from '@/shared/components/data-state';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import { useCreateBatch, usePendingFulfillments } from '../hooks/use-batches';
import { batchRoutes } from '../routes/batch.routes';

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (batchId: number) => void;
  /**
   * Wave-mode hand-off from the fulfillments page multi-select: the staged
   * fulfillment ids seed the review step directly (the dialog OPENS on the
   * review step since the selection already happened on the list).
   */
  initialIds?: number[];
}

const WAREHOUSE_DEFAULT = 'default';

/**
 * Two-step wizard: 1) tick pending fulfillments, 2) review + create.
 * 201 fresh → success screen with "Open batch" CTA; 200 → idempotent
 * replay info + same CTA. Engine 422s surface verbatim inline.
 * NOTE: pending-fulfillments rows always carry items_count 0 (no count
 * eager-load) — it is deliberately NOT displayed.
 */
export function CreateBatchDialog({
  open,
  onOpenChange,
  onCreated,
  initialIds,
}: CreateBatchDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateBatch();

  const [selected, setSelected] = useState<number[]>(initialIds ?? []);
  const [warehouseValue, setWarehouseValue] = useState<string>(WAREHOUSE_DEFAULT);
  const [step, setStep] = useState<1 | 2>(
    initialIds !== undefined && initialIds.length > 0 ? 2 : 1
  );
  const [created, setCreated] = useState<{ id: number; number: string } | null>(null);

  const { data: warehousesResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehousesResponse?.data ?? [];

  const warehouseId =
    warehouseValue === WAREHOUSE_DEFAULT ? undefined : Number(warehouseValue);
  const { data, isLoading } = usePendingFulfillments({ warehouseId, limit: 100 });
  const rows = data?.data ?? [];

  if (!open) return null;

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    createMutation.mutate(
      {
        fulfillment_ids: selected,
        ...(warehouseId ? { warehouse_id: warehouseId } : {}),
      },
      {
        onSuccess: (response) => {
          setCreated({ id: response.data.id, number: response.data.batch_number });
        },
      }
    );
  };

  const handleClose = (next: boolean) => {
    if (!next && created) onCreated?.(created.id);
    onOpenChange(next);
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                {t('batches.createSuccessTitle')}
              </DialogTitle>
              <DialogDescription>
                {t('batches.createSuccessDescription', { number: created.number })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                {t('common.close')}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  window.location.assign(batchRoutes.detail(created.id));
                }}
              >
                {t('batches.openBatch')}
              </Button>
            </DialogFooter>
          </>
        ) : step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5" />
                {t('batches.createTitle')}
              </DialogTitle>
              <DialogDescription>{t('batches.createStep1')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Warehouse className="h-4 w-4" />
                {t('batches.warehouse')}
              </Label>
              <Select
                value={warehouseValue}
                onValueChange={(v) => {
                  if (v !== null) {
                    setWarehouseValue(v);
                    setSelected([]);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('batches.warehouse')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WAREHOUSE_DEFAULT}>
                    {t('batches.defaultWarehouse')}
                  </SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                      {warehouse.name} ({warehouse.code})
                      {warehouse.is_default ? ' ★' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[40vh] space-y-2 overflow-y-auto pe-1">
              {isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t('common.loading')}
                </p>
              ) : rows.length === 0 ? (
                <DataEmptyState
                  className="border-0"
                  title={t('batches.noPendingTitle')}
                  description={t('batches.noPendingDescription')}
                />
              ) : (
                rows.map((row) => (
                  <label
                    key={row.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selected.includes(row.id)}
                      onCheckedChange={() => toggle(row.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm font-medium">
                        {row.fulfillment_number}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t('batches.pendingOrder', { id: row.order_id })}
                        {row.assigned_to !== null
                          ? ' · ' + t('batches.pendingAssignee', { id: row.assigned_to })
                          : ''}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={selected.length === 0}
              >
                {t('batches.continueReview', { count: selected.length })}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('batches.reviewTitle')}</DialogTitle>
              <DialogDescription>
                {t('batches.reviewDescription', { count: selected.length })}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
              <p className="font-mono text-xs text-muted-foreground">
                {selected.join(', ')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('batches.reviewHint')}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={createMutation.isPending}
              >
                {t('common.back')}
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending
                  ? t('batches.creating')
                  : t('batches.createAction')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
