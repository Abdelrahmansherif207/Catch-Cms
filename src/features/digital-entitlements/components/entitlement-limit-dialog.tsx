import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import type { ApiErrorResponse } from '@/shared/api';
import type { DigitalEntitlement } from '../types/digital-entitlement.types';
import { ENTITLEMENT_LIMIT_MAX } from '../types/digital-entitlement.types';
import { useSetEntitlementLimit } from '../hooks/use-digital-entitlements';

interface EntitlementLimitDialogProps {
  entitlement: DigitalEntitlement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/**
 * Override the download cap of one entitlement.
 * - number input mirrors the server bounds (0 … 4294967295; both verified);
 * - the Unlimited switch sends the absent-key body form ({}), which the
 *   backend treats as unlimited (0) — code-verified;
 * - on success the toast surfaces previous_limit for a quick one-click undo.
 */
export function EntitlementLimitDialog({
  entitlement,
  open,
  onOpenChange,
  onSaved,
}: EntitlementLimitDialogProps) {
  const { t } = useTranslation();

  // State seeds once per OPENED TARGET — the table remounts this dialog
  // with a key, so every open starts from the row's current values.
  const [unlimited, setUnlimited] = useState<boolean>(() => entitlement?.unlimited ?? false);
  const [limitValue, setLimitValue] = useState<string>(() =>
    entitlement ? (entitlement.unlimited ? '' : String(entitlement.download_limit)) : '',
  );
  const [error, setError] = useState<string | null>(null);

  const limitMutation = useSetEntitlementLimit();

  const validate = (): boolean => {
    if (unlimited) return true;
    const n = Number(limitValue);
    if (limitValue === '' || Number.isNaN(n) || !Number.isInteger(n)) {
      setError(t('entitlements.limitValidation.integer'));
      return false;
    }
    if (n < 0) {
      setError(t('entitlements.limitValidation.min'));
      return false;
    }
    if (n > ENTITLEMENT_LIMIT_MAX) {
      setError(t('entitlements.limitValidation.max'));
      return false;
    }
    return true;
  };

  const close = (next: boolean) => {
    if (!next) setError(null);
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!entitlement) return;
    if (!validate()) return;

    const payloadLimit = unlimited ? null : Number(limitValue);
    try {
      const response = await limitMutation.mutateAsync({
        uuid: entitlement.uuid,
        limit: payloadLimit,
      });
      toast.success(
        t('entitlements.limitToast.saved', {
          previous: response.data.previous_limit,
          current: response.data.download_limit,
          unlimited: response.data.unlimited ? t('entitlements.unlimited') : String(response.data.download_limit),
        }),
      );
      close(false);
      onSaved();
    } catch (caught) {
      const apiError = caught as ApiErrorResponse;
      const fieldMsg = apiError?.errors?.limit?.[0];
      setError(fieldMsg || apiError?.message || t('entitlements.limitToast.failed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('entitlements.limitTitle')}</DialogTitle>
          <DialogDescription>
            {t('entitlements.limitSubtitle', {
              name: entitlement?.product?.name ?? entitlement?.uuid ?? '',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="limit-unlimited">{t('entitlements.unlimitedLabel')}</Label>
            <Switch
              id="limit-unlimited"
              checked={unlimited}
              onCheckedChange={(checked) => setUnlimited(Boolean(checked))}
            />
          </div>

          {!unlimited && (
            <div className="space-y-1.5">
              <Label htmlFor="limit-value">{t('entitlements.limitValue')}</Label>
              <Input
                id="limit-value"
                type="number"
                min={0}
                step={1}
                value={limitValue}
                onChange={(e) => {
                  setLimitValue(e.target.value);
                  setError(null);
                }}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground">
                {t('entitlements.limitBounds', { max: ENTITLEMENT_LIMIT_MAX })}
              </p>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={limitMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={limitMutation.isPending}>
            {limitMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t('entitlements.limitSave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
