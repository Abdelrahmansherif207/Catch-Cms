import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useDeleteTargeting } from '../hooks/use-coupons';

interface DeleteTargetingDialogProps {
  couponId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTargetingDialog({
  couponId,
  open,
  onOpenChange,
}: DeleteTargetingDialogProps) {
  const { t } = useTranslation();
  const [apiError, setApiError] = useState<string | null>(null);

  const deleteMutation = useDeleteTargeting(couponId);

  const handleDelete = () => {
    setApiError(null);
    deleteMutation.mutate(undefined, {
      onSuccess: () => onOpenChange(false),
      onError: (error: unknown) => {
        const apiError = error as { message?: string };
        setApiError(apiError?.message || null);
      },
    });
  };

  const isPending = deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('coupons.targeting.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('coupons.targeting.deleteDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{t('coupons.targeting.deleteWarning')}</span>
          </div>

          {apiError && (
            <div className="rounded-lg border border-transparent bg-destructive-soft p-3 text-sm text-destructive">
              {apiError}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('coupons.targeting.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
