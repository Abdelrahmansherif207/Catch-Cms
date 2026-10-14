import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ban } from 'lucide-react';
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
import { useCancelBatch } from '../hooks/use-batches';
import { batchReasonSchema } from '../schemas/batch.schema';
import type { BatchDetail } from '../types/batch.types';

interface CancelBatchDialogProps {
  batch: BatchDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Cancelling releases ALL open tasks to skipped (picked work untouched)
 * and writes the reason into notes — the warning copy says exactly that
 * so managers understand the blast radius before confirming.
 */
export function CancelBatchDialog({ batch, open, onOpenChange }: CancelBatchDialogProps) {
  const { t } = useTranslation();
  const cancelMutation = useCancelBatch();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = () => {
    const parsed = batchReasonSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('batches.reasonRequired'));
      return;
    }
    setError(null);
    cancelMutation.mutate(
      { id: batch.id, payload: parsed.data },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            {t('batches.cancelTitle', { number: batch.batch_number })}
          </DialogTitle>
          <DialogDescription>{t('batches.cancelDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="batch-cancel-reason">{t('batches.reason')}</Label>
          <Textarea
            id="batch-cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('batches.cancelReasonPlaceholder')}
            rows={3}
            maxLength={2000}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{t(error)}</p>}
          <p className="text-xs text-muted-foreground">{t('batches.cancelWarning')}</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={cancelMutation.isPending || reason.trim().length === 0}
          >
            {cancelMutation.isPending
              ? t('batches.cancelling')
              : t('batches.cancelAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
