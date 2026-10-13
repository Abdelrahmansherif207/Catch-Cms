import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Repeat, KeyRound, LockKeyhole, FileText } from 'lucide-react';
import { queryKeys } from '@/shared/lib/query-keys';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import type { DigitalAsset, PendingDigitalAsset } from '../types/digital-asset.types';
import { fetchDigitalAssets } from '../api/digital-assets.api';
import {
  useAddLicenseKeys,
  useCreateDigitalAsset,
  useDeleteDigitalAsset,
  useDigitalAssets,
  useReplaceDigitalAsset,
} from '../hooks/use-digital-assets';
import { ASSET_TYPE_ICONS, formatAssetSize, useAssetTypeLabel } from './digital-asset-meta';
import { CreateDigitalAssetDialog } from './digital-asset-add-dialog';
import { ReplaceFileAssetDialog } from './digital-asset-replace-dialog';
import { LicenseKeysDialog } from './digital-asset-keys-dialog';

interface DigitalAssetsSectionProps {
  /** Existing product id → live mode (rows come from the API). Undefined → buffered create-mode. */
  productId?: number;
  /** Buffered rows for create mode (persisted in the parent form). */
  value?: PendingDigitalAsset[];
  /** Create-mode buffer change reporter (persisted in the parent form). */
  onChange?: (rows: PendingDigitalAsset[]) => void;
}


export function DigitalAssetsSection({ productId, value, onChange }: DigitalAssetsSectionProps) {
  const { t } = useTranslation();
  const label = useAssetTypeLabel();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [addOpen, setAddOpen] = useState(false);
  const [replaceAsset, setReplaceAsset] = useState<DigitalAsset | null>(null);
  const [keysAsset, setKeysAsset] = useState<DigitalAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<DigitalAsset | null>(null);

  const isLive = !!productId;
  const { data, isLoading } = useDigitalAssets(productId);
  const liveRows = isLive ? (data?.data ?? []) : [];
  const rows: (DigitalAsset | PendingDigitalAsset)[] = isLive ? liveRows : (value ?? []);

  const createMutation = useCreateDigitalAsset(productId);
  const replaceMutation = useReplaceDigitalAsset(productId);
  const deleteMutation = useDeleteDigitalAsset(productId);
  const licenseKeysMutation = useAddLicenseKeys(productId);

  /**
   * Deletion resolves by re-fetching the list: non-FILE deletes can still
   * report HTTP 500 even after the row was removed server-side, so the
   * fresh list — not the status code — is the source of truth.
   */
  const handleConfirmDelete = async () => {
    if (!deletingAsset) return;
    const target = deletingAsset;
    setDeletingAsset(null);
    try {
      await deleteMutation.mutateAsync(target.uuid);
      const fresh = await queryClient.fetchQuery({
        queryKey: queryKeys.products.digitalAssets.list(productId as number),
        queryFn: () => fetchDigitalAssets(productId as number),
      });
      if (!fresh.data.some((asset) => asset.uuid === target.uuid)) {
        toast.success(t('digitalAssets.toast.deleted'));
      } else {
        toast.error(t('digitalAssets.toast.deleteFailed'));
      }
    } catch {
      toast.error(t('digitalAssets.toast.deleteFailed'));
    }
  };

  const handleRowDelete = (row: DigitalAsset | PendingDigitalAsset) => {
    if ('uuid' in row) {
      setDeletingAsset(row as DigitalAsset);
    } else {
      onChange?.((value ?? []).filter((pend) => pend.localId !== (row as PendingDigitalAsset).localId));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('digitalAssets.title')}
        </h3>
        {can(PERMISSIONS.products.create) && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="me-1 h-4 w-4" />
            {t('digitalAssets.add')}
          </Button>
        )}
      </div>

      {!isLive && <p className="text-xs text-muted-foreground">{t('digitalAssets.createModeHint')}</p>}

      {isLive && isLoading && rows.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </p>
      )}

      {(rows.length === 0 && (!isLive || !isLoading)) && (
        <p className="text-sm text-muted-foreground italic">{t('digitalAssets.empty')}</p>
      )}

      {rows.length > 0 && (
        <ul className="rounded-lg border">
          {rows.map((row) => (
            <AssetRow
              key={'uuid' in row ? row.uuid : row.localId}
              row={row}
              isLive={isLive}
              canReplace={row.type === 'FILE' && isLive && can(PERMISSIONS.products.update)}
              canDelete={isLive ? can(PERMISSIONS.products.update) : true}
              canManageKeys={
                isLive && row.type === 'LICENSE' && can(PERMISSIONS.products.manageDigitalLicenses)
              }
              onReplace={() => 'uuid' in row && setReplaceAsset(row as DigitalAsset)}
              onKeys={() => 'uuid' in row && setKeysAsset(row as DigitalAsset)}
              onDelete={() => handleRowDelete(row)}
            />
          ))}
        </ul>
      )}

      <CreateDigitalAssetDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        productId={productId}
        onBuffer={(draft) =>
          onChange?.([
            ...(value ?? []),
            {
              localId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              ...draft,
              original_name:
                draft.type === 'FILE' && draft.file
                  ? draft.file.name
                  : draft.type === 'URL'
                    ? (draft.external_url ?? '')
                    : draft.type === 'ACCESS'
                      ? t('digitalAssets.defaultNames.access')
                      : t('digitalAssets.defaultNames.license'),
              size: draft.type === 'FILE' && draft.file ? draft.file.size : 0,
            },
          ])
        }
        onSubmit={async (payload) => {
          const response = await createMutation.mutateAsync(payload);
          // Agreed UX: jump straight into key provisioning for new pools —
          // inline when keys were typed in the dialog, empty-draft fallback
          // opens the dedicated dialog right after creation.
          if (response.data?.type === 'LICENSE' && response.data?.uuid) {
            setAddOpen(false);
            if (payload.keys && payload.keys.length > 0) {
              const provisioned = await licenseKeysMutation.mutateAsync({
                uuid: response.data.uuid,
                keys: payload.keys,
              });
              toast.success(
                t('digitalAssets.toast.keysImported', {
                  created: provisioned.data.created,
                  duplicates: provisioned.data.skipped_duplicate,
                  blanks: provisioned.data.skipped_blank,
                }),
              );
            } else {
              setKeysAsset(response.data);
            }
          }
        }}
      />

      <ReplaceFileAssetDialog
        asset={replaceAsset}
        open={!!replaceAsset}
        onOpenChange={(open) => {
          if (!open) setReplaceAsset(null);
        }}
        onReplace={async (uuid, file) => {
          await replaceMutation.mutateAsync({ uuid, file });
        }}
      />

      <LicenseKeysDialog
        asset={keysAsset}
        open={!!keysAsset}
        onOpenChange={(open) => {
          if (!open) setKeysAsset(null);
        }}
        onProvision={async (uuid, keys) => {
          const response = await licenseKeysMutation.mutateAsync({ uuid, keys });
          return response.data;
        }}
      />

      <ConfirmDialog
        open={!!deletingAsset}
        onOpenChange={(open) => {
          if (!open) setDeletingAsset(null);
        }}
        tone="danger"
        title={t('digitalAssets.deleteTitle')}
        description={
          deletingAsset
            ? t('digitalAssets.deleteWarning', {
                type: label(deletingAsset.type),
                name: deletingAsset.original_name,
              })
            : ''
        }
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

interface AssetRowProps {
  row: DigitalAsset | PendingDigitalAsset;
  isLive: boolean;
  canReplace: boolean;
  canDelete: boolean;
  canManageKeys: boolean;
  onReplace: () => void;
  onKeys: () => void;
  onDelete: () => void;
}

function AssetRow({
  row,
  isLive,
  canReplace,
  canDelete,
  canManageKeys,
  onReplace,
  onKeys,
  onDelete,
}: AssetRowProps) {
  const { t } = useTranslation();
  const label = useAssetTypeLabel();
  const Icon = ASSET_TYPE_ICONS[row.type] ?? FileText;

  const externalUrl = 'external_url' in row ? (row.external_url ?? undefined) : undefined;
  const buffered = !isLive;
  const displayName =
    buffered && 'file' in row && row.file
      ? row.file.name
      : buffered && (row as PendingDigitalAsset).secret
        ? t('digitalAssets.maskedSecret')
        : row.original_name ?? '';

  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        {!buffered && externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-xs text-primary hover:underline"
          >
            {externalUrl}
          </a>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {row.type === 'FILE' ? formatAssetSize(row.size || 0) : ''}
      </span>
      <span className="text-xs text-muted-foreground">
        {buffered &&
        row.type === 'LICENSE' &&
        (row as PendingDigitalAsset).keys?.length
          ? t('digitalAssets.rowKeysPending', {
              count: (row as PendingDigitalAsset).keys!.length,
            })
          : ''}
      </span>
      <Badge variant="outline" className="shrink-0 text-xs">
        {label(row.type)}
      </Badge>
      <div className="flex shrink-0 items-center gap-1">
        {canReplace && (
          <Button type="button" variant="ghost" size="sm" onClick={onReplace}>
            <Repeat className="me-1 h-4 w-4" />
            {t('digitalAssets.replace')}
          </Button>
        )}
        {canManageKeys && (
          <Button type="button" variant="ghost" size="sm" onClick={onKeys}>
            <KeyRound className="me-1 h-4 w-4" />
            {t('digitalAssets.keysImport')}
          </Button>
        )}
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {row.type === 'ACCESS' && (
        <span className="w-full text-xs text-muted-foreground">
          <LockKeyhole className="me-1 inline h-3 w-3" />
          {t('digitalAssets.secretNote')}
        </span>
      )}
    </li>
  );
}
