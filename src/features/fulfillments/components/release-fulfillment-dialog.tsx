import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, PackageCheck, Warehouse, XCircle } from 'lucide-react';
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
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import { useReleaseFulfillments } from '../hooks/use-fulfillments';
import { FulfillmentStatusBadge } from './fulfillment-status-badge';
import { isBulkReleaseResponse } from '../api/fulfillments.api';
import type { BulkReleaseResponseData } from '../types/fulfillment.types';

interface ReleaseFulfillmentDialogProps {
  orderIds: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called on close with the order ids that produced a fulfillment (to clear selection). */
  onReleased?: (releasedOrderIds: number[]) => void;
}

const WAREHOUSE_DEFAULT = 'default';

export function ReleaseFulfillmentDialog({
  orderIds,
  open,
  onOpenChange,
  onReleased,
}: ReleaseFulfillmentDialogProps) {
  const { t } = useTranslation();
  const releaseMutation = useReleaseFulfillments();
  const [results, setResults] = useState<BulkReleaseResponseData | null>(null);
  const [warehouseValue, setWarehouseValue] = useState<string>(WAREHOUSE_DEFAULT);

  const { data: warehousesResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehousesResponse?.data ?? [];

  // NB: gated render — the whole Dialog mounts only while open, so internal
  // state re-initializes fresh without a reset effect (react-hooks rule).
  if (!open) return null;

  const handleRelease = () => {
    releaseMutation.mutate(
      {
        // ALWAYS bulk — uniform shape and the batch endpoint never 404s
        // (unknown/refused orders land in failed[] with HTTP 200).
        order_ids: orderIds,
        ...(warehouseValue !== WAREHOUSE_DEFAULT
          ? { warehouse_id: Number(warehouseValue) }
          : {}),
      },
      {
        onSuccess: (response) => {
          if (isBulkReleaseResponse(response)) {
            setResults(response.data as BulkReleaseResponseData);
          } else {
            // Single-mode engine reply (defensive) — reduce into the batch shape.
            const detail = (
              response as unknown as { data: { id?: number; order_id?: number } }
            ).data;
            setResults({
              released: [
                {
                  order_id: detail.order_id ?? 0,
                  fulfillment_id: detail.id ?? 0,
                  fulfillment_number: '—',
                  status: '—',
                  items_count: '—',
                },
              ],
              failed: [],
              summary: { total: 1, released_count: 1, failed_count: 0 },
            });
          }
        },
      }
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    if (results) {
      onReleased?.(results.released.map((row) => row.order_id));
    }
  };

  const hasFailures = !!results && results.failed.length > 0;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) handleClose();
        else onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {!results ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5" />
                {t('fulfillments.releaseTitle')}
              </DialogTitle>
              <DialogDescription>
                {t('fulfillments.releaseDescription', { count: orderIds.length })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
                <p className="text-sm font-medium">
                  {t('fulfillments.releaseSelection', { count: orderIds.length })}
                </p>
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                  {orderIds.join(', ')}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Warehouse className="h-4 w-4" />
                  {t('fulfillments.warehouse')}
                </Label>
                <Select
                  value={warehouseValue}
                  onValueChange={(v) => {
                    if (v !== null) setWarehouseValue(v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('fulfillments.warehouse')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WAREHOUSE_DEFAULT}>
                      {t('fulfillments.defaultWarehouse')}
                    </SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                        {warehouse.name} ({warehouse.code}){warehouse.is_default ? ' ★' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('fulfillments.defaultWarehouseHint')}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={releaseMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="button" onClick={handleRelease} disabled={releaseMutation.isPending}>
                {releaseMutation.isPending
                  ? t('fulfillments.releasing')
                  : t('fulfillments.releaseAction')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('fulfillments.releaseResultsTitle')}</DialogTitle>
              <DialogDescription>
                {t('fulfillments.releaseResultsSummary', {
                  released: results.summary.released_count,
                  failed: results.summary.failed_count,
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pe-1">
              {results.released.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-success">
                    {t('fulfillments.releasedList', { count: results.released.length })}
                  </p>
                  <div className="rounded-lg border divide-y overflow-hidden">
                    {results.released.map((row) => (
                      <div
                        key={row.order_id + '-' + row.fulfillment_id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="font-medium">{row.fulfillment_number}</span>
                          <span className="text-xs text-muted-foreground">
                            {t('fulfillments.releaseFromOrder', { id: row.order_id })}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {Number(row.items_count)}
                          </span>
                          <FulfillmentStatusBadge status={row.status} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.failed.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-destructive">
                    {t('fulfillments.failedList', { count: results.failed.length })}
                  </p>
                  <div className="rounded-lg border divide-y overflow-hidden">
                    {results.failed.map((row) => (
                      <div
                        key={row.order_id}
                        className="flex items-start gap-2 px-3 py-2 text-sm"
                      >
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <div className="min-w-0">
                          <p className="font-medium">
                            {t('fulfillments.releaseFromOrder', { id: row.order_id })}
                          </p>
                          <p className="text-xs text-muted-foreground">{row.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('fulfillments.failedKeptSelected')}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              {hasFailures && (
                <p className="me-auto text-xs text-muted-foreground">
                  {t('fulfillments.releaseResultsNote')}
                </p>
              )}
              <Button type="button" onClick={handleClose}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
