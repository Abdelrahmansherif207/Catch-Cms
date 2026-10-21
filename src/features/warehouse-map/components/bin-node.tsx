import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Node, NodeProps } from '@xyflow/react';
import { Ban } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { WarehouseLocation } from '@/features/locations/types/location.types';
import { binStyleFor } from '../lib/bin-style';
import { formatUnits } from '../lib/contents';

/**
 * Node payload for one bin. Type alias (not interface) on purpose —
 * @xyflow/react v12 constrains node data to Record-compatible shapes.
 */
export type BinNodeData = {
  location: WarehouseLocation;
  /** Focus mode is active and this bin is NOT part of it. */
  dimmed: boolean;
  /** Focus mode is active and this bin IS part of it. */
  highlighted: boolean;
  /** Route stop number badge; null outside route focus. */
  badge: number | null;
  /**
   * Occupied-bin stock: total units for always-on chips, or the focused
   * product's units in product focus mode. Null = not loaded / not shown.
   */
  contentsQty: number | null;
};

export type BinMapNode = Node<BinNodeData, 'bin'>;

function BinNodeComponent({ data, selected }: NodeProps<BinMapNode>) {
  const { t } = useTranslation();
  const { location } = data;
  const style = binStyleFor(location.type);
  const inactive = location.status === 'inactive';
  const typeLabel = location.type ? t(`locations.types.${location.type}`) : t('locations.unclassified');

  return (
    <div
      className={cn(
        'relative flex h-16 w-24 flex-col justify-between gap-0.5 rounded-lg border bg-card px-2 py-1.5 shadow-xs transition-opacity',
        style.border,
        inactive && 'opacity-60 saturate-50',
        data.dimmed && 'opacity-20',
        data.highlighted && 'ring-2 ring-primary',
        selected && 'border-primary'
      )}
      title={`${location.code} — ${location.name} · ${typeLabel}${inactive ? ` · ${t('warehouseMap.statusInactive')}` : ''}`}
    >
      {data.badge !== null && (
        <span className="absolute -top-2 -end-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-primary-foreground shadow-sm">
          {data.badge}
        </span>
      )}

      <span className="truncate font-mono text-xs font-bold leading-tight text-foreground">
        {location.code}
      </span>
      <span className="truncate text-[10px] leading-tight text-muted-foreground">
        {location.name}
      </span>

      <span className="flex items-center justify-between gap-1">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', style.dot)} aria-label={typeLabel} />
        {!data.dimmed && data.contentsQty !== null && (
          <span
            className="truncate text-[10px] font-semibold leading-none text-primary"
            title={t('warehouseMap.unitsInBin', { count: data.contentsQty })}
          >
            ×{formatUnits(data.contentsQty)}
          </span>
        )}
        {inactive && (
          <Ban className="h-3 w-3 text-muted-foreground" aria-label={t('warehouseMap.statusInactive')} />
        )}
      </span>
    </div>
  );
}

export const BinNode = memo(BinNodeComponent);
