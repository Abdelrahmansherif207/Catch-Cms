import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackageX } from 'lucide-react';
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
import { useVoidPackage } from '@/features/packages/hooks/use-packages';
import { voidPackageSchema } from '@/features/packages/schemas/package.schema';
import type { PackageListItem } from '@/features/packages/types/package.types';

interface VoidPackageDialogProps {
  pkg: PackageListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Manager-only void of an OPEN package — the reason is trimmed and stored
 * on the row (items retained for audit; the units count back into the
 * remaining math, so a replacement package can accept them again).
 */
export function VoidPackageDialog({ pkg, open, onOpenChange }: VoidPackageDialogProps) {
  const { t } = useTranslation();
  const voidMutation = useVoidPackage();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Gated render — remounts fresh per open (no reset effect).
  if (!open) return null;

  const handleSubmit = () => {
    const parsed = voidPackageSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('packages.voidReasonRequired'));
      return;
    }
    setError(null);
    voidMutation.mutate(
      { id: pkg.id, payload: parsed.data },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageX className="h-5 w-5" />
            {t('packages.voidTitle', { id: pkg.id })}
          </DialogTitle>
          <DialogDescription>{t('packages.voidDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="package-void-reason">{t('packages.voidReason')}</Label>
          <Textarea
            id="package-void-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('packages.voidReasonPlaceholder')}
            rows={3}
            maxLength={2000}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{t(error)}</p>}
          <p className="text-xs text-muted-foreground">{t('packages.voidWarning')}</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={voidMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={voidMutation.isPending || reason.trim().length === 0}
          >
            {voidMutation.isPending ? t('packages.voiding') : t('packages.void')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
