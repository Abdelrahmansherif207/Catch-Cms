import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import type { ApiErrorResponse } from '@/shared/api';
import type { DigitalAssetType } from '../types/digital-asset.types';
import {
  DIGITAL_ASSET_ACCEPT,
  DIGITAL_ASSET_EXTENSIONS,
  DIGITAL_ASSET_MAX_SIZE_BYTES,
  LICENSE_KEY_MAX_LENGTH,
  LICENSE_KEYS_MAX_BATCH,
} from '../types/digital-asset.types';
import { ASSET_TYPE_OPTIONS, parseLicenseKeys, useAssetTypeHint } from './digital-asset-meta';
import type { AssetTypeOption } from './digital-asset-meta';
import { LicenseKeyInputs } from './license-key-inputs';

/** Full add-dialog payload; `keys` is LICENSE-only and always provisioned
 *  in the follow-up license-keys call — never on the create call itself. */
export interface AssetDraftPayload {
  type: DigitalAssetType;
  file?: File;
  external_url?: string;
  secret?: string;
  keys?: string[];
}

interface CreateDigitalAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Product id when live mode (uploads immediately); undefined = buffered for create flow. */
  productId?: number;
  /** Buffered mode: hands the draft row to the parent (flushed after product creation). */
  onBuffer?: (draft: AssetDraftPayload) => void;
  /** Live mode: performs the create + (LICENSE) provisioning; must be awaited so the dialog can close on success. */
  onSubmit?: (payload: AssetDraftPayload) => Promise<unknown>;
}

export function CreateDigitalAssetDialog({
  open,
  onOpenChange,
  productId,
  onBuffer,
  onSubmit,
}: CreateDigitalAssetDialogProps) {
  const { t } = useTranslation();
  const hint = useAssetTypeHint();

  const [type, setType] = useState<DigitalAssetType>('FILE');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [rowKeys, setRowKeys] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const accept = DIGITAL_ASSET_ACCEPT;

  const parsedKeys = parseLicenseKeys(rowKeys.join('\n'));

  const reset = () => {
    setFile(null);
    setFileError(null);
    setExternalUrl('');
    setSecret('');
    setRowKeys([]);
    setFieldError(null);
  };

  const validate = (): boolean => {
    if (type === 'FILE' && !file) {
      setFieldError(t('digitalAssets.validation.fileRequired'));
      return false;
    }
    if (type === 'URL' && !externalUrl.trim()) {
      setFieldError(t('digitalAssets.validation.urlRequired'));
      return false;
    }
    if (type === 'ACCESS' && !secret.trim()) {
      setFieldError(t('digitalAssets.validation.secretRequired'));
      return false;
    }
    if (type === 'LICENSE' && parsedKeys.length > LICENSE_KEYS_MAX_BATCH) {
      setFieldError(t('digitalAssets.validation.keysTooMany', { count: LICENSE_KEYS_MAX_BATCH }));
      return false;
    }
    if (type === 'LICENSE' && parsedKeys.some((key) => key.length > LICENSE_KEY_MAX_LENGTH)) {
      setFieldError(t('digitalAssets.validation.keyTooLong'));
      return false;
    }
    return true;
  };

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setFileError(null);
    if (next) {
      const ext = next.name.split('.').pop()?.toLowerCase() ?? '';
      if (!DIGITAL_ASSET_EXTENSIONS.includes(ext as (typeof DIGITAL_ASSET_EXTENSIONS)[number])) {
        setFileError(t('digitalAssets.validation.fileExtension', { extensions: DIGITAL_ASSET_EXTENSIONS.join(', ') }));
      } else if (next.size > DIGITAL_ASSET_MAX_SIZE_BYTES) {
        setFileError(t('digitalAssets.validation.fileTooLarge'));
      }
    }
  };

  const closeWithReset = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    setFieldError(null);
    if (!validate() || fileError) return;

    const payload: AssetDraftPayload = {
      type,
      ...(type === 'FILE' ? { file: file as File } : {}),
      ...(type === 'URL' ? { external_url: externalUrl.trim() } : {}),
      ...(type === 'ACCESS' ? { secret: secret.trim() } : {}),
      ...(type === 'LICENSE' ? { keys: parsedKeys } : {}),
    };

    try {
      setPending(true);
      if (productId && onSubmit) {
        await onSubmit(payload);
        toast.success(t('digitalAssets.toast.added'));
        reset();
        onOpenChange(false);
      } else {
        onBuffer?.(payload);
        toast.success(t('digitalAssets.toast.addedToBuffer'));
        reset();
        onOpenChange(false);
      }
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      setFieldError(apiError?.message || t('digitalAssets.toast.addFailed'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeWithReset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('digitalAssets.addTitle')}</DialogTitle>
          <DialogDescription>{t('digitalAssets.addSubtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('digitalAssets.type')}</Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as DigitalAssetType);
                setFieldError(null);
                setFileError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPE_OPTIONS.map((option: AssetTypeOption) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{hint(type)}</p>
          </div>

          {type === 'FILE' && (
            <div className="space-y-1.5">
              <Label htmlFor="asset-file">{t('digitalAssets.fileField')}</Label>
              <Input
                id="asset-file"
                type="file"
                accept={accept}
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                {t('digitalAssets.limits.file', { size: Math.round(DIGITAL_ASSET_MAX_SIZE_BYTES / (1024 * 1024)) })}
              </p>
            </div>
          )}

          {type === 'URL' && (
            <div className="space-y-1.5">
              <Label htmlFor="asset-url">{t('digitalAssets.urlField')}</Label>
              <Input
                id="asset-url"
                type="url"
                placeholder="https://…"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            </div>
          )}

          {type === 'ACCESS' && (
            <div className="space-y-1.5">
              <Label htmlFor="asset-secret">{t('digitalAssets.secretField')}</Label>
              <Input
                id="asset-secret"
                type="password"
                maxLength={LICENSE_KEY_MAX_LENGTH}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('digitalAssets.hints.oneTime')}</p>
            </div>
          )}

          {type === 'LICENSE' && (
            <div className="space-y-1.5">
              <Label htmlFor="asset-license-keys">{t('digitalAssets.keysField')}</Label>
              <LicenseKeyInputs
                values={rowKeys}
                onChange={setRowKeys}
              />
            </div>
          )}

          {(fieldError || fileError) && (
            <p className="text-xs text-destructive">{fieldError || fileError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => closeWithReset(false)} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={pending || (type === 'FILE' && !!fileError)}>
            {t('digitalAssets.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
