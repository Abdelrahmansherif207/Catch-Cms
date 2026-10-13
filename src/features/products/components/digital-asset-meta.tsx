/**
 * Shared runtime bits for the digital assets UI.
 * Keeping constants here avoids circular imports between the dialogs.
 */
import { useTranslation } from 'react-i18next';
import { FileText, KeyRound, LockKeyhole, Link as LinkIcon } from 'lucide-react';
import type { DigitalAssetType } from '../types/digital-asset.types';

/** Human size label used by the editable section and the detail card. */
export function formatAssetSize(bytes: number): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${Math.round(value * 10) / 10} ${units[unit]}`;
}

/**
 * Parses bulk key input exactly the way the backend expects before it can
 * accept it: trimmed lines, blanks dropped, and duplicates WITHIN the
 * request removed (the validation layer rejects `keys.N` duplicates in the
 * same call — 422 "Duplicate license key in this request."). Duplicates
 * against keys already stored in the pool remain legal and are reported
 * via the `skipped_duplicate` counter.
 */
export function parseLicenseKeys(raw: string): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const key = line.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

export interface LicenseProvisionResult {
  created: number;
  skipped_blank: number;
  skipped_duplicate: number;
}

export const ASSET_TYPE_ICONS: Record<DigitalAssetType, typeof FileText> = {
  FILE: FileText,
  URL: LinkIcon,
  ACCESS: LockKeyhole,
  LICENSE: KeyRound,
};

export interface AssetTypeOption {
  value: DigitalAssetType;
  labelKey: string;
  icon: typeof FileText;
}

/** Ordered list of creatable asset types for the add-asset dialog. */
export const ASSET_TYPE_OPTIONS: AssetTypeOption[] = [
  { value: 'FILE', labelKey: 'digitalAssets.types.FILE', icon: FileText },
  { value: 'URL', labelKey: 'digitalAssets.types.URL', icon: LinkIcon },
  { value: 'ACCESS', labelKey: 'digitalAssets.types.ACCESS', icon: LockKeyhole },
  { value: 'LICENSE', labelKey: 'digitalAssets.types.LICENSE', icon: KeyRound },
];

/** Localized type labels, keyed to digitalAssets.types.* keys. */
export function useAssetTypeLabel() {
  const { t } = useTranslation();
  const labels: Record<DigitalAssetType, string> = {
    FILE: t('digitalAssets.types.FILE'),
    URL: t('digitalAssets.types.URL'),
    ACCESS: t('digitalAssets.types.ACCESS'),
    LICENSE: t('digitalAssets.types.LICENSE'),
  };
  return (type: DigitalAssetType) => labels[type];
}

/** Localized per-type description used in the add dialog. */
export function useAssetTypeHint() {
  const { t } = useTranslation();
  const hints: Record<DigitalAssetType, string> = {
    FILE: t('digitalAssets.hints.file'),
    URL: t('digitalAssets.hints.url'),
    ACCESS: t('digitalAssets.hints.access'),
    LICENSE: t('digitalAssets.hints.license'),
  };
  return (type: DigitalAssetType) => hints[type];
}
