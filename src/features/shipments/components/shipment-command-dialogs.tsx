import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
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
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

interface ShipmentNotesDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  loadingLabel: string;
  /** ≤2000 single commands; ≤500 on the bulk paths. */
  maxLength?: number;
  pending: boolean;
  onSubmit: (payload: { notes: string | null }) => void;
  onClose: () => void;
}

/**
 * Shared notes command dialog (dispatch / deliver — optional single-line
 * notes, server rule max 2000 for singles). The mutation outcome (toast)
 * lives in the caller's hook; a success closes via the caller wiring.
 */
export function ShipmentNotesDialog({
  title,
  description,
  confirmLabel,
  loadingLabel,
  maxLength = 2000,
  pending,
  onSubmit,
  onClose,
}: ShipmentNotesDialogProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="shipment-notes">{t('shipments.messages')}</Label>
          <Input
            id="shipment-notes"
            maxLength={maxLength}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('shipments.messagesPlaceholder')}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => onSubmit({ notes: notes.trim() || null })} disabled={pending}>
            {pending ? loadingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ShipmentCancelDialogProps {
  title: string;
  description: string;
  pending: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

/**
 * Cancel dialog — `reason` required, non-blank after trim (BatchCommandRequest
 * contract); the engine refuses terminal/post-dispatch rows with verbatim
 * 422 texts surfaced by the hook's toast.
 */
export function ShipmentCancelDialog({
  title,
  description,
  pending,
  onSubmit,
  onClose,
}: ShipmentCancelDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      setError(t('shipments.cancelReasonRequired'));
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
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="shipment-cancel-reason">
            {t('shipments.cancelReason')}
          </Label>
          <Textarea
            id="shipment-cancel-reason"
            maxLength={2000}
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('shipments.cancelReasonPlaceholder')}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{t(error)}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={pending}>
            {pending ? t('shipments.cancelling') : t('shipments.cancelSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
