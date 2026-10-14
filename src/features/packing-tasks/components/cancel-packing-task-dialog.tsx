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
import { useCancelPackingTask } from '../hooks/use-packing-tasks';
import { cancelPackingTaskSchema } from '../schemas/packing-task.schema';
import type { PackingTaskDetail, PackingTaskListItem } from '../types/packing-task.types';

interface CancelPackingTaskDialogProps {
  task: PackingTaskDetail | PackingTaskListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Manager-only cancellation — the reason is trimmed and stored on the task
 * (the row itself is retained for audit). Completed work cannot be unwound
 * server-side, so the dialog warns about it up front.
 */
export function CancelPackingTaskDialog({
  task,
  open,
  onOpenChange,
}: CancelPackingTaskDialogProps) {
  const { t } = useTranslation();
  const cancelMutation = useCancelPackingTask();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Gated render — remounts fresh per open (no reset effect).
  if (!open) return null;

  const handleSubmit = () => {
    const parsed = cancelPackingTaskSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('packingTasks.cancelReasonRequired'));
      return;
    }
    setError(null);
    cancelMutation.mutate(
      { id: task.id, payload: parsed.data },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            {t('packingTasks.cancelTitle', { id: task.id })}
          </DialogTitle>
          <DialogDescription>{t('packingTasks.cancelDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="packing-cancel-reason">{t('packingTasks.cancelReason')}</Label>
          <Textarea
            id="packing-cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('packingTasks.cancelReasonPlaceholder')}
            rows={3}
            maxLength={2000}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{t(error)}</p>}
          <p className="text-xs text-muted-foreground">{t('packingTasks.cancelWarning')}</p>
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
              ? t('packingTasks.cancelling')
              : t('packingTasks.cancelSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
