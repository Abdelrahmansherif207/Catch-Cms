import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Hand } from 'lucide-react';
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
import { useRecordPick } from '../hooks/use-picking-tasks';
import { taskProgress } from '../schemas/picking-task.schema';
import type { PickingTaskDetail } from '../types/picking-task.types';

interface RecordPickDialogProps {
  task: PickingTaskDetail;
  /** Allocates the next op_seq at submit time (replay protection). */
  onOpSeq: () => number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPickDialog({
  task,
  onOpSeq,
  open,
  onOpenChange,
}: RecordPickDialogProps) {
  const { t } = useTranslation();
  const recordMutation = useRecordPick();
  const progress = taskProgress(task);

  const [quantity, setQuantity] = useState<string>(String(progress.remaining || 1));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const qty = Number(quantity);

  const handleSubmit = () => {
    if (!Number.isFinite(qty) || qty <= 0) {
      setError(t('pickingTasks.pickQtyPositive'));
      return;
    }
    setError(null);
    recordMutation.mutate(
      {
        id: task.id,
        payload: {
          quantity: qty,
          notes: notes.trim() ? notes.trim() : undefined,
          op_seq: onOpSeq(),
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5" />
            {t('pickingTasks.pickTitle', { id: task.id })}
          </DialogTitle>
          <DialogDescription>
            {t('pickingTasks.pickDescription', {
              picked: progress.picked,
              total: progress.total,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pick-quantity">{t('pickingTasks.pickQty')}</Label>
            <Input
              id="pick-quantity"
              type="number"
              min={0.01}
              step="any"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setError(null);
              }}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              {t('pickingTasks.pickRemaining', { remaining: progress.remaining })}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pick-notes">{t('pickingTasks.pickNotes')}</Label>
            <Textarea
              id="pick-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t('pickingTasks.pickNotesPlaceholder')}
              rows={2}
              maxLength={2000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={recordMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={recordMutation.isPending}
          >
            {recordMutation.isPending
              ? t('pickingTasks.picking')
              : t('pickingTasks.pickAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
