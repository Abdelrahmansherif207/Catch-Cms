import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle } from 'lucide-react';
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
import { Textarea } from '@/shared/ui/textarea';

interface CancelOrderDialogProps {
  orderNumber: string;
  pending: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

/**
 * Order cancel dialog — `reason` is REQUIRED server-side
 * (BatchCommandRequest: required|string|min:1|max:2000) and the engine may
 * refuse with a verbatim 422 (live shipment, packed work, sealed custody);
 * those texts surface through the hook's error toast.
 */
export function CancelOrderDialog({ orderNumber, pending, onSubmit, onClose }: CancelOrderDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      setError(t('orders.cancelDialog.reasonRequired'));
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            {t('orders.cancelDialog.dialogTitle', { orderNumber })}
          </DialogTitle>
          <DialogDescription>{t('orders.cancelDialog.dialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="order-cancel-reason">{t('orders.cancelDialog.reason')}</Label>
          <Textarea
            id="order-cancel-reason"
            maxLength={2000}
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('orders.cancelDialog.reasonPlaceholder')}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={pending}>
            {pending ? t('orders.cancelDialog.cancelling') : t('orders.cancelDialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
