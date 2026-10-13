import { useTranslation } from 'react-i18next';
import { Loader2, KeyRound, Link as LinkIcon, LockKeyhole } from 'lucide-react';
import { CardSection } from '@/shared/components/card-section';
import { Badge } from '@/shared/ui/badge';
import { useDigitalAssets } from '../hooks/use-digital-assets';
import { ASSET_TYPE_ICONS, formatAssetSize, useAssetTypeLabel } from './digital-asset-meta';

interface DigitalAssetsCardProps {
  productId: number;
}

/** Read-only overview of a DIGITAL product's assets on the detail page. */
export function DigitalAssetsCard({ productId }: DigitalAssetsCardProps) {
  const { t } = useTranslation();
  const label = useAssetTypeLabel();
  const { data, isLoading } = useDigitalAssets(productId);
  const assets = data?.data ?? [];

  if (isLoading) {
    return (
      <CardSection title={t('digitalAssets.title')} icon={KeyRound}>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </p>
      </CardSection>
    );
  }

  return (
    <CardSection title={t('digitalAssets.title')} icon={KeyRound}>
      {assets.length === 0 && (
        <p className="text-sm text-muted-foreground italic">{t('digitalAssets.empty')}</p>
      )}

      {assets.length > 0 && (
        <ul className="divide-y">
          {assets.map((asset) => {
            const Icon = ASSET_TYPE_ICONS[asset.type] ?? LinkIcon;
            return (
              <li key={asset.uuid} className="flex flex-wrap items-center gap-3 py-2.5 last:pb-0">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {asset.type === 'ACCESS'
                      ? t('digitalAssets.maskedSecret')
                      : asset.original_name}
                  </p>
                  {asset.type === 'URL' && asset.external_url && (
                    <a
                      href={asset.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-xs text-primary hover:underline"
                    >
                      {asset.external_url}
                    </a>
                  )}
                </div>
                {asset.type === 'FILE' && (
                  <span className="text-xs text-muted-foreground">
                    {formatAssetSize(asset.size)}
                  </span>
                )}
                <Badge variant="outline" className="shrink-0 text-xs">
                  {label(asset.type)}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <LockKeyhole className="h-3 w-3" />
        {t('digitalAssets.cardNote')}
      </p>
    </CardSection>
  );
}
