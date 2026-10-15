import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Ship, XCircle } from 'lucide-react';
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
import { FulfillmentStatusBadge } from './fulfillment-status-badge';
import { useBulkCreateShipments } from '../hooks/use-fulfillments';
import type {
  BulkCreateShipmentsResult,
  FulfillmentListItem,
} from '../types/fulfillment.types';

interface BulkCreateShipmentsDialogProps {
  selected: FulfillmentListItem[];
  maxCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Ship mode (bulk create labels, POST /admin/fulfillments/create-shipments):
 * ALWAYS 200 with successful/failed/summary. The shared optional fields
 * (courier ≤100, method ≤100, notes ≤500) apply to EVERY created label —
 * the bulk path accepts NO idempotency_key and NO per-address payload.
 */
export function BulkCreateShipmentsDialog({
  selected,
  maxCount,
  open,
  onOpenChange,
  onSuccess,
}: BulkCreateShipmentsDialogProps) {
  const { t } = useTranslation();
  const bulkMutation = useBulkCreateShipments();
  const [courier, setCourier] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [results, setResults] = useState<BulkCreateShipmentsResult | null>(null);

  if (!open) return null;

  const overCap = selected.length > maxCount;

  const handleSubmit = () => {
    const trimmed = (value: string) => {
      const out = value.trim();
      return out.length > 0 ? out : null;
    };
    bulkMutation.mutate(
      {
        fulfillment_ids: selected.map((row) => row.id),
        courier: trimmed(courier),
        shipping_method: trimmed(shippingMethod),
        notes: trimmed(notes),
      },
      {
        onSuccess: (response) => {
          setResults(response.data);
          onSuccess();
        },
      }
    );
  };

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {results === null ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                {t('fulfillments.bulkShipTitle')}
              </DialogTitle>
              <DialogDescription>
                {t('fulfillments.bulkShipDescription', { count: selected.length })}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pe-1">
              <p className="text-sm font-medium">
                {t('fulfillments.bulkPackingSelected', { count: selected.length })}
              </p>
              <div className="rounded-lg border divide-y overflow-hidden">
                {selected.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="font-mono">{row.fulfillment_number}</span>
                    <FulfillmentStatusBadge status={row.status} />
                  </div>
                ))}
              </div>
              {overCap && (
                <p className="text-xs text-warning">
                  {t('fulfillments.bulkPackingOverCap', { max: maxCount })}
                </p>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-ship-courier">
                    {t('fulfillments.bulkShipCourier')}
                  </Label>
                  <Input
                    id="bulk-ship-courier"
                    maxLength={100}
                    placeholder={t('fulfillments.bulkShipCourierPlaceholder')}
                    value={courier}
                    onChange={(event) => setCourier(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-ship-method">
                    {t('fulfillments.bulkShipMethod')}
                  </Label>
                  <Input
                    id="bulk-ship-method"
                    maxLength={100}
                    placeholder={t('fulfillments.bulkShipMethodPlaceholder')}
                    value={shippingMethod}
                    onChange={(event) => setShippingMethod(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bulk-ship-notes">{t('fulfillments.bulkShipNotes')}</Label>
                <Input
                  id="bulk-ship-notes"
                  maxLength={500}
                  placeholder={t('fulfillments.bulkShipNotesPlaceholder')}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('fulfillments.bulkShipFieldsHint')}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={bulkMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={bulkMutation.isPending || overCap}
              >
                {bulkMutation.isPending
                  ? t('fulfillments.bulkShipStarting')
                  : t('fulfillments.bulkShipAction')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('fulfillments.bulkShipResultsTitle')}</DialogTitle>
              <DialogDescription>
                {t('fulfillments.bulkPackingResultsSummary', {
                  created: results.summary.success_count,
                  failed: results.summary.failed_count,
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pe-1">
              {results.successful.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-success">
                    {t('fulfillments.bulkShipCreatedList', {
                      count: results.successful.length,
                    })}
                  </p>
                  <div className="rounded-lg border divide-y overflow-hidden">
                    {results.successful.map((row) => (
                      <div
                        key={row.fulfillment_id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="font-medium">{row.fulfillment_number}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {t('fulfillments.bulkShipShipment', { id: row.shipment_id })}
                          </span>
                          {row.courier && (
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                              {row.courier}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.failed.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-destructive">
                    {t('fulfillments.bulkPackingFailedList', {
                      count: results.failed.length,
                    })}
                  </p>
                  <div className="rounded-lg border divide-y overflow-hidden">
                    {results.failed.map((row) => (
                      <div
                        key={row.fulfillment_id}
                        className="flex items-start gap-2 px-3 py-2 text-sm"
                      >
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <div className="min-w-0">
                          <p className="font-medium">
                            {row.fulfillment_number ?? '#' + row.fulfillment_id}
                          </p>
                          <p className="text-xs text-muted-foreground">{row.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
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
