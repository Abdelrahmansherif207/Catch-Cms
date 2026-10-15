import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCheck } from 'lucide-react';
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
import { useVerifyPackingTask } from '../hooks/use-packing-tasks';
import { verifyPackingSchema } from '../schemas/packing-task.schema';
import type { PackingTaskDetail } from '../types/packing-task.types';

interface VerifyPackingDialogProps {
  task: PackingTaskDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Verification is server-checked (siblings closed + packaged quantities) —
 * quantity/sibling 422 texts surface verbatim as toasts.
 */
export function VerifyPackingDialog({ task, open, onOpenChange }: VerifyPackingDialogProps) {
  const { t } = useTranslation();
  const verifyMutation = useVerifyPackingTask();
  const [notes, setNotes] = useState('');

  // Gated render — remounts fresh per open (no reset effect).
  if (!open) return null;

  const handleSubmit = () => {
    const parsed = verifyPackingSchema.safeParse({ notes });
    if (!parsed.success) {
      return;
    }
    const trimmed = parsed.data.notes?.trim();
    verifyMutation.mutate(
      { id: task.id, payload: trimmed ? { notes: trimmed } : {} },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5" />
            {t('packingTasks.verifyTitle', { id: task.id })}
          </DialogTitle>
          <DialogDescription>{t('packingTasks.verifyDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="verify-notes">{t('packingTasks.verifyNotes')}</Label>
          <Textarea
            id="verify-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('packingTasks.verifyNotesPlaceholder')}
            rows={3}
            maxLength={2000}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={verifyMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={verifyMutation.isPending}
          >
            {verifyMutation.isPending
              ? t('packingTasks.verifying')
              : t('packingTasks.verifySubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
