import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, RotateCcw } from 'lucide-react';
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
import { useRetrySkippedTasks } from '../hooks/use-batches';
import { batchReasonSchema } from '../schemas/batch.schema';
import { skippedBatchTasks } from '../schemas/batch.schema';
import { pickingTaskRoutes } from '@/features/picking-tasks/routes/picking-task.routes';
import type { BatchDetail, BatchTaskRow } from '../types/batch.types';

interface RetrySkippedDialogProps {
  batch: BatchDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Retry skipped work: one replacement task per retryable skipped item.
 * The results screen lists the created replacements with pick links.
 * An empty array is the distinct "Nothing retryable" success — the
 * dialog says so instead of looking broken. Repeat retry with an open
 * task 409s (NOT a safe replay) — the message surfaces verbatim.
 */
export function RetrySkippedDialog({ batch, open, onOpenChange }: RetrySkippedDialogProps) {
  const { t } = useTranslation();
  const retryMutation = useRetrySkippedTasks();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<BatchTaskRow[] | null>(null);

  const skipped = skippedBatchTasks(batch.tasks);

  if (!open) return null;

  const handleSubmit = () => {
    const parsed = batchReasonSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('batches.reasonRequired'));
      return;
    }
    setError(null);
    retryMutation.mutate(
      { id: batch.id, payload: parsed.data },
      {
        onSuccess: (response) => {
          setCreated(response.data);
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                {created.length === 0
                  ? t('batches.retryEmptyTitle')
                  : t('batches.retryResultsTitle', { count: created.length })}
              </DialogTitle>
              <DialogDescription>
                {created.length === 0
                  ? t('batches.retryEmptyDescription')
                  : t('batches.retryResultsDescription')}
              </DialogDescription>
            </DialogHeader>

            {created.length > 0 && (
              <div className="max-h-[40vh] space-y-2 overflow-y-auto pe-1">
                {created.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => window.location.assign(pickingTaskRoutes.detail(task.id))}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-start hover:bg-muted/40"
                  >
                    <span className="font-mono text-sm font-medium">#{task.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {t('batches.retryOpenTask')}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                {t('batches.retryTitle')}
              </DialogTitle>
              <DialogDescription>
                {t('batches.retryDescription', { count: skipped.length })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="batch-retry-reason">{t('batches.reason')}</Label>
              <Textarea
                id="batch-retry-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t('batches.retryReasonPlaceholder')}
                rows={3}
                maxLength={2000}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{t(error)}</p>}
              <p className="text-xs text-muted-foreground">{t('batches.retryWarning')}</p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={retryMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={retryMutation.isPending || reason.trim().length === 0}
              >
                {retryMutation.isPending
                  ? t('batches.retrying')
                  : t('batches.retryAction')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
