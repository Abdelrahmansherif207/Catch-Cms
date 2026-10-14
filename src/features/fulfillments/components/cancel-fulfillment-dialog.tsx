import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { useCancelFulfillment } from '../hooks/use-fulfillments';
import type { FulfillmentDetail } from '../types/fulfillment.types';

interface CancelFulfillmentDialogProps {
  fulfillment: FulfillmentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CancelFulfillmentDialog({
  fulfillment,
  open,
  onOpenChange,
  onSuccess,
}: CancelFulfillmentDialogProps) {
  const { t } = useTranslation();
  const cancelMutation = useCancelFulfillment();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  // NB: gated render — the Dialog mounts only while open, so the reason
  // draft resets naturally (react-hooks rule).
  if (!open) return null;

  const handleCancel = () => {
    if (!fulfillment) return;
    if (!reason.trim()) {
      setError(t('fulfillments.cancelReasonRequired'));
      return;
    }
    cancelMutation.mutate(
      { id: fulfillment.id, payload: { reason: reason.trim() } },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess();
        },
      }
    );
  };

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('fulfillments.cancelTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('fulfillments.cancelConfirm', {
              number: fulfillment?.fulfillment_number ?? '',
            })}
            <span className="mt-2 block text-foreground">
              {t('fulfillments.cancelWarning')}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* The backend VALIDATES `reason` as required (live-verified 422). */}
        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">{t('fulfillments.cancelReason')} *</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(undefined);
            }}
            rows={3}
            aria-invalid={!!error}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? t('fulfillments.cancelling') : t('fulfillments.cancelAction')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
