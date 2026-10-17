import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react';
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
import { FilterSelect } from '@/shared/components/filter-select';
import { SHIPMENT_UPDATE_STATUSES } from '@/features/tracking/types/tracking.types';
import type { ShipmentUpdateStatus, UpdateShipmentStatusData } from '@/features/tracking/types/tracking.types';

interface UpdateShipmentDialogProps {
  orderId: number;
  /** Pre-fill from the current shipment read (may be null pre-label). */
  currentStatus: string | null;
  currentTrackingNumber: string | null;
  currentCourier: string | null;
  currentEstimatedDeliveryAt: string | null;
  pending: boolean;
  onSubmit: (payload: UpdateShipmentStatusData) => void;
  onClose: () => void;
}

/**
 * Shipment status transition dialog for
 * POST /admin/orders/{orderId}/shipment/update-status. `status` is the only
 * REQUIRED field (closed nine-state set); any transition VALIDITY refusal
 * (skipping states etc.) is listener/service territory and surfaces as the
 * backend's generic 500 "Failed to update shipment status".
 */
export function UpdateShipmentDialog({
  orderId,
  currentStatus,
  currentTrackingNumber,
  currentCourier,
  currentEstimatedDeliveryAt,
  pending,
  onSubmit,
  onClose,
}: UpdateShipmentDialogProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>(
    currentStatus && SHIPMENT_UPDATE_STATUSES.includes(currentStatus as ShipmentUpdateStatus)
      ? currentStatus
      : 'all'
  );
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber ?? '');
  const [courierName, setCourierName] = useState(currentCourier ?? '');
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState(
    currentEstimatedDeliveryAt ? currentEstimatedDeliveryAt.slice(0, 10) : ''
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const statusOptions = SHIPMENT_UPDATE_STATUSES.map((value) => ({
    value,
    label: t(`orders.shipmentStatuses.${value}`, { defaultValue: value }),
  }));

  const handleSubmit = () => {
    if (status === 'all') {
      setError(t('orders.shipmentDialog.statusRequired'));
      return;
    }
    setError(null);
    const payload: UpdateShipmentStatusData = {
      status: status as ShipmentUpdateStatus,
    };
    if (trackingNumber.trim()) payload.tracking_number = trackingNumber.trim();
    if (courierName.trim()) payload.courier_name = courierName.trim();
    if (estimatedDeliveryAt) payload.estimated_delivery_at = estimatedDeliveryAt;
    if (notes.trim()) payload.notes = notes.trim();
    onSubmit(payload);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            {t('orders.shipmentDialog.title', { id: orderId })}
          </DialogTitle>
          <DialogDescription>{t('orders.shipmentDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t('orders.shipmentDialog.status')}</Label>
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              prefix={t('orders.shipmentDialog.status')}
              allLabel={t('orders.shipmentDialog.selectStatus')}
              options={statusOptions}
              triggerClassName="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shipment-tracking-number">
              {t('orders.shipmentDialog.trackingNumber')}
            </Label>
            <Input
              id="shipment-tracking-number"
              maxLength={255}
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="TRK-..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shipment-courier">{t('orders.shipmentDialog.courier')}</Label>
            <Input
              id="shipment-courier"
              maxLength={255}
              value={courierName}
              onChange={(event) => setCourierName(event.target.value)}
              placeholder={t('orders.shipmentDialog.courierPlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shipment-eta">{t('orders.shipmentDialog.eta')}</Label>
            <Input
              id="shipment-eta"
              type="date"
              value={estimatedDeliveryAt}
              onChange={(event) => setEstimatedDeliveryAt(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t('orders.shipmentDialog.etaHint')}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shipment-notes">{t('orders.shipmentDialog.notes')}</Label>
            <Input
              id="shipment-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t('orders.shipmentDialog.notesPlaceholder')}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? t('orders.shipmentDialog.updating') : t('orders.shipmentDialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
