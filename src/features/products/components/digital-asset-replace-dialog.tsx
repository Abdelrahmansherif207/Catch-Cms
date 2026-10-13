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
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import type { ApiErrorResponse } from '@/shared/api';
import type { DigitalAsset } from '../types/digital-asset.types';
import {
  DIGITAL_ASSET_ACCEPT,
  DIGITAL_ASSET_EXTENSIONS,
  DIGITAL_ASSET_MAX_SIZE_BYTES,
} from '../types/digital-asset.types';

interface ReplaceFileAssetDialogProps {
  asset: DigitalAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Performs the replace request; must be awaited so the dialog can close on success. */
  onReplace: (uuid: string, file: File) => Promise<unknown>;
}

/**
 * Swaps a FILE asset's bytes. Identity (uuid/original_name) is preserved
 * server-side — only mime/size/updated_at refresh, so the row label stays
 * while the file is exchanged underneath.
 */
export function ReplaceFileAssetDialog({
  asset,
  open,
  onOpenChange,
  onReplace,
}: ReplaceFileAssetDialogProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const reset = () => {
    setFile(null);
    setError(null);
  };

  const closeWithReset = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const validate = (next: File): string | null => {
    const ext = next.name.split('.').pop()?.toLowerCase() ?? '';
    if (!DIGITAL_ASSET_EXTENSIONS.includes(ext as (typeof DIGITAL_ASSET_EXTENSIONS)[number])) {
      return t('digitalAssets.validation.fileExtension', {
        extensions: DIGITAL_ASSET_EXTENSIONS.join(', '),
      });
    }
    if (next.size > DIGITAL_ASSET_MAX_SIZE_BYTES) {
      return t('digitalAssets.validation.fileTooLarge');
    }
    return null;
  };

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setError(next ? validate(next) : null);
  };

  const handleSubmit = async () => {
    if (!asset || !file) return;
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setPending(true);
      await onReplace(asset.uuid, file);
      toast.success(t('digitalAssets.toast.replaced'));
      reset();
      onOpenChange(false);
    } catch (caught) {
      const apiError = caught as ApiErrorResponse;
      setError(apiError?.message || t('digitalAssets.toast.replaceFailed'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeWithReset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('digitalAssets.replaceTitle')}</DialogTitle>
          <DialogDescription>
            {t('digitalAssets.replaceSubtitle', {
              name: asset ? asset.original_name : '',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="replace-file">{t('digitalAssets.fileField')}</Label>
            <Input
              id="replace-file"
              type="file"
              accept={DIGITAL_ASSET_ACCEPT}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              {t('digitalAssets.limits.file', {
                size: Math.round(DIGITAL_ASSET_MAX_SIZE_BYTES / (1024 * 1024)),
              })}
            </p>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => closeWithReset(false)} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={pending || !file || !!error}>
            {pending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t('digitalAssets.replace')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
