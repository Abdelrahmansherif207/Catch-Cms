import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SkipForward } from 'lucide-react';
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
import { useSkipPickingTask } from '../hooks/use-picking-tasks';
import { skipTaskSchema } from '../schemas/picking-task.schema';
import type { PickingTaskDetail, PickingTaskListItem } from '../types/picking-task.types';

interface SkipTaskDialogProps {
  task: PickingTaskDetail | PickingTaskListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SkipTaskDialog({ task, open, onOpenChange }: SkipTaskDialogProps) {
  const { t } = useTranslation();
  const skipMutation = useSkipPickingTask();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Gated render — the Dialog mounts only while open so internal state
  // re-initializes fresh without a reset effect (react-hooks rule).
  if (!open) return null;

  const handleSubmit = () => {
    const parsed = skipTaskSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('pickingTasks.skipReasonRequired'));
      return;
    }
    setError(null);
    skipMutation.mutate(
      { id: task.id, payload: parsed.data },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SkipForward className="h-5 w-5" />
            {t('pickingTasks.skipTitle', { id: task.id })}
          </DialogTitle>
          <DialogDescription>
            {t('pickingTasks.skipDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="skip-reason">{t('pickingTasks.skipReason')}</Label>
          <Textarea
            id="skip-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('pickingTasks.skipReasonPlaceholder')}
            rows={3}
            maxLength={2000}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{t(error)}</p>}
          <p className="text-xs text-muted-foreground">{t('pickingTasks.skipWarning')}</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={skipMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={skipMutation.isPending || reason.trim().length === 0}
          >
            {skipMutation.isPending
              ? t('pickingTasks.skipping')
              : t('pickingTasks.skipAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
