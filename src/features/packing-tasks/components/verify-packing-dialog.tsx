import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, TriangleAlert } from 'lucide-react';
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

/** One item whose picked units are not fully inside packages. */
export interface VerifyCoverageRow {
  itemId: number;
  picked: number;
  packed: number;
}

interface VerifyPackingDialogProps {
  task: PackingTaskDetail;
  /**
   * Client-mirrored verify_quantities deficits — when present the engine
   * WILL refuse; submit stays locked until the packages cover them.
   */
  coverage?: VerifyCoverageRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Verification is server-checked (siblings closed + packaged quantities) —
 * quantity/sibling 422 texts surface verbatim as toasts. The coverage
 * snapshot keeps the obvious `picked N, packed M` refusal from ever
 * leaving the screen.
 */
export function VerifyPackingDialog({
  task,
  coverage,
  open,
  onOpenChange,
}: VerifyPackingDialogProps) {
  const { t } = useTranslation();
  const verifyMutation = useVerifyPackingTask();
  const [notes, setNotes] = useState('');

  // Gated render — remounts fresh per open (no reset effect).
  if (!open) return null;

  const coverageBlocked = Boolean(coverage && coverage.length > 0);

  const handleSubmit = () => {
    if (coverageBlocked) return;
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
          {coverageBlocked && (
            <div className="rounded-lg bg-warning-soft p-3 text-xs text-warning">
              <span className="flex items-center gap-1.5 font-medium">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                {t('packingTasks.verifyBlockedHeading')}
              </span>
              <ul className="mt-1.5 space-y-1 font-mono">
                {coverage!.map((row) => (
                  <li key={row.itemId}>
                    {t('packingTasks.verifyCoverageRow', {
                      itemId: row.itemId,
                      picked: row.picked,
                      packed: row.packed,
                    })}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5">{t('packingTasks.verifyBlockedHint')}</p>
            </div>
          )}
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
            disabled={verifyMutation.isPending || coverageBlocked}
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
