import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Repeat, TriangleAlert } from 'lucide-react';
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
import type { ApiErrorResponse } from '@/shared/api';
import type { EmptyLocationResultData } from '../types/inventory.types';
import { useEmptyLocation } from '../hooks/use-inventory';

interface EmptyLocationDialogProps {
  locationId: number;
  locationName: string;
  locationCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Empty-bin housekeeping (DELETE /admin/locations/{id}/products): removes
 * ONLY zero-quantity/zero-hint placement rows — the bin row itself survives.
 * The server refuses stocked bins / open picking work with verbatim
 * translated 422s (flat, id interpolated) shown inline; an already-empty bin
 * is an idempotent 200 with a truthful zero-count payload (not an error).
 */
export function EmptyLocationDialog({
  locationId,
  locationName,
  locationCode,
  open,
  onOpenChange,
}: EmptyLocationDialogProps) {
  const { t } = useTranslation();
  // Fresh state per open cycle: the usage site remounts this dialog on the
  // open toggle (key), so local result/refusal states always start clean —
  // no setState-in-effect needed.
  const [result, setResult] = useState<EmptyLocationResultData | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const mutation = useEmptyLocation();

  const handleEmpty = () => {
    mutation.mutate(locationId, {
      onSuccess: (response) => {
        setResult(response.data);
      },
      onError: (error) => {
        setRefusal((error as unknown as ApiErrorResponse)?.message ?? null);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {result ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {result.removed > 0 ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    {t('inventory.emptied')}
                  </>
                ) : (
                  <>
                    <Repeat className="h-5 w-5 text-muted-foreground" />
                    {t('inventory.alreadyEmpty')}
                  </>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('inventory.emptyResultNote')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t('inventory.removedRows')}
                </span>
                <span className="font-semibold tabular-nums">{result.removed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t('inventory.remainingRows')}
                </span>
                <span className="font-semibold tabular-nums">
                  {result.remaining}
                </span>
              </div>
              {result.removed_ids.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  #{result.removed_ids.join(' · #')}
                </p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('inventory.done')}</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('inventory.emptyTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('inventory.emptyConfirm')}{' '}
                <strong>{locationName}</strong>{' '}
                <span className="text-muted-foreground">({locationCode})</span>?
                <span className="mt-2 block">
                  {t('inventory.emptyDescription')}
                </span>
                <span className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t('inventory.emptyHint')}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            {refusal && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <span className="block text-xs font-medium uppercase tracking-wide opacity-80">
                    {t('inventory.emptyBlocked')}
                  </span>
                  {refusal}
                </span>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={mutation.isPending}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleEmpty}
                disabled={mutation.isPending}
              >
                {mutation.isPending
                  ? t('inventory.emptying')
                  : t('inventory.emptyButton')}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
