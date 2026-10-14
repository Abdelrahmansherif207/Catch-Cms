import { useState } from 'react';
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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { useCreateShipment } from '../hooks/use-fulfillments';
import type { FulfillmentDetail } from '../types/fulfillment.types';

interface CreateShipmentDialogProps {
  fulfillment: FulfillmentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateShipmentDialog({
  fulfillment,
  open,
  onOpenChange,
  onSuccess,
}: CreateShipmentDialogProps) {
  const { t } = useTranslation();
  const shipmentMutation = useCreateShipment();
  const [courier, setCourier] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  // NB: gated render — the Dialog mounts only while open, so label drafts
  // reset naturally (react-hooks rule).
  if (!open) return null;

  const handleCreate = () => {
    if (!fulfillment) return;
    shipmentMutation.mutate(
      {
        id: fulfillment.id,
        // All fields nullable — an empty body is valid on a ready fulfillment
        // (test-verified). NULL-filtered label fields only.
        payload: {
          courier: courier.trim() || undefined,
          shipping_method: shippingMethod.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess();
        },
        onError: (error) => {
          // 409 duplicate-label and cross-row-binding conflicts carry only a
          // live message (handled by the hook toast); 422 length violations
          // carry an errors map.
          const apiError = error as {
            status?: number;
            errors?: Record<string, string[]>;
          };
          if (apiError?.status === 422 && apiError.errors) {
            setServerErrors(apiError.errors);
          }
        },
      }
    );
  };

  const getError = (field: string): string | undefined => {
    const serverErr = serverErrors[field]?.[0];
    return serverErr;
  };

  const renderError = (message?: string) =>
    message ? <p className="text-xs text-destructive">{message}</p> : null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('fulfillments.shipmentTitle')}</DialogTitle>
          <DialogDescription>
            {t('fulfillments.shipmentDescription', {
              number: fulfillment?.fulfillment_number ?? '',
            })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
          className="space-y-3"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="shipment-courier">{t('fulfillments.shipmentCourier')}</Label>
            <Input
              id="shipment-courier"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="Aramex"
              aria-invalid={!!getError('courier')}
            />
            {renderError(getError('courier'))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shipment-method">{t('fulfillments.shipmentMethod')}</Label>
            <Input
              id="shipment-method"
              value={shippingMethod}
              onChange={(e) => setShippingMethod(e.target.value)}
              placeholder="standard"
              aria-invalid={!!getError('shipping_method')}
            />
            {renderError(getError('shipping_method'))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shipment-notes">{t('fulfillments.shipmentNotes')}</Label>
            <Textarea
              id="shipment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              aria-invalid={!!getError('notes')}
            />
            {renderError(getError('notes'))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={shipmentMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={shipmentMutation.isPending}>
              {shipmentMutation.isPending
                ? t('fulfillments.shipmentCreating')
                : t('fulfillments.shipmentAction')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
