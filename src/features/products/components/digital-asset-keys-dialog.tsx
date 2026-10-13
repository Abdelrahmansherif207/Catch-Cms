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
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import type { ApiErrorResponse } from '@/shared/api';
import type { DigitalAsset } from '../types/digital-asset.types';
import { LICENSE_KEY_MAX_LENGTH, LICENSE_KEYS_MAX_BATCH } from '../types/digital-asset.types';
import { parseLicenseKeys, type LicenseProvisionResult } from './digital-asset-meta';
import { LicenseKeyInputs } from './license-key-inputs';

interface LicenseKeysDialogProps {
  asset: DigitalAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Performs the provisioning request; resolves with the counters for the toast. */
  onProvision: (uuid: string, keys: string[]) => Promise<LicenseProvisionResult>;
}

/**
 * Provision license keys into a LICENSE pool asset.
 * Keys are typed into independent inputs (row-per-key, "+ Add Key" to grow,
 * multi-line paste auto-splits). Keys are encrypted at rest and never
 * echoed back — the toast reports counts only (created/duplicates/blanks).
 */
export function LicenseKeysDialog({
  asset,
  open,
  onOpenChange,
  onProvision,
}: LicenseKeysDialogProps) {
  const { t } = useTranslation();
  const [rowKeys, setRowKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const parsedKeys = parseLicenseKeys(rowKeys.join('\n'));

  const validate = (): string | null => {
    if (parsedKeys.length === 0) {
      return t('digitalAssets.validation.keysRequired');
    }
    if (parsedKeys.length > LICENSE_KEYS_MAX_BATCH) {
      return t('digitalAssets.validation.keysTooMany', { count: LICENSE_KEYS_MAX_BATCH });
    }
    if (parsedKeys.some((key) => key.length > LICENSE_KEY_MAX_LENGTH)) {
      return t('digitalAssets.validation.keyTooLong');
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!asset) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setPending(true);
      const result = await onProvision(asset.uuid, parsedKeys);
      toast.success(
        t('digitalAssets.toast.keysImported', {
          created: result.created,
          duplicates: result.skipped_duplicate,
          blanks: result.skipped_blank,
        }),
      );
      setRowKeys([]);
      setError(null);
      onOpenChange(false);
    } catch (caught) {
      const apiError = caught as ApiErrorResponse;
      setError(apiError?.message || t('digitalAssets.toast.keysFailed'));
    } finally {
      setPending(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Cancel keeps the typed rows so a large batch is never lost.
      setError(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('digitalAssets.keysTitle')}</DialogTitle>
          <DialogDescription>
            {t('digitalAssets.keysSubtitle', { name: asset?.original_name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('digitalAssets.keysField')}</Label>
            <LicenseKeyInputs values={rowKeys} onChange={setRowKeys} />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={pending || parsedKeys.length === 0}>
            {pending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t('digitalAssets.keysImport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
