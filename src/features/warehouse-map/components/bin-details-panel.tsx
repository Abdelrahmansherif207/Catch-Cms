import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { CardSection } from '@/shared/components/card-section';
import { StatusBadge } from '@/shared/components/status-badge';
import { Badge } from '@/shared/ui/badge';
import { locationRoutes } from '@/features/locations/routes/location.routes';
import { binStyleFor } from '../lib/bin-style';
import { formatUnits, variantAttributesLabel } from '../lib/contents';
import type { WarehouseLocation } from '@/features/locations/types/location.types';
import type { OccupancyProduct, PickRouteStop } from '../types/warehouse-map.types';

interface BinDetailsPanelProps {
  bin: WarehouseLocation;
  parentBin: WarehouseLocation | null;
  routeStop: PickRouteStop | null;
  /** Live bin contents — empty until the occupancy check has responded. */
  binProducts: OccupancyProduct[];
  /** True once the check-occupancy response (or a "no permission" gate) resolved. */
  binProductsReady: boolean;
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium text-foreground" title={value}>
        {value}
      </dd>
    </div>
  );
}

/** Side panel with the selected bin's facts + jump link to its detail page. */
export function BinDetailsPanel({
  bin,
  parentBin,
  routeStop,
  binProducts,
  binProductsReady,
}: BinDetailsPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const style = binStyleFor(bin.type);

  return (
    <CardSection
      title={bin.code}
      description={bin.name}
      icon={MapPin}
      action={
        <Button variant="outline" size="sm" onClick={() => navigate(locationRoutes.detail(bin.id))}>
          <ExternalLink className="me-1.5 h-3.5 w-3.5" />
          {t('warehouseMap.openBinPage')}
        </Button>
      }
    >
      <dl className="divide-y divide-border">
        <FactRow label={t('locations.type')} value={bin.type ? t(`locations.types.${bin.type}`) : t('locations.unclassified')} />
        <FactRow label={t('common.status')} value={bin.status ?? t('locations.noStatus')} />
        <FactRow label={t('locations.barcode')} value={bin.barcode ?? t('common.noData')} />
        <FactRow label={t('locations.priority')} value={bin.priority !== null ? String(bin.priority) : t('common.noData')} />
        <FactRow label={t('locations.parent')} value={parentBin ? parentBin.code : t('locations.parentPlaceholder')} />
        <FactRow label={t('locations.updatedAt')} value={bin.updated_at} />
      </dl>

      <div className="mt-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden />
        <span className="text-xs text-muted-foreground">
          {bin.type ? t(`locations.types.${bin.type}`) : t('locations.unclassified')}
        </span>
        {bin.status && <StatusBadge status={bin.status} />}
      </div>

      {routeStop && (
        <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 p-3">
          <Badge className="mb-1.5">{t('warehouseMap.sequence', { number: routeStop.sequence })}</Badge>
          <p className="text-sm text-foreground">
            {t('warehouseMap.order')} #{routeStop.orderId} · {t('pickingTasks.pickQty')}: {routeStop.quantityToPick}
          </p>
        </div>
      )}

      {binProductsReady && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('warehouseMap.productsInBin')}
          </p>
          {binProducts.length === 0 ? (
            <p className="mt-2 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
              {t('warehouseMap.emptyBin')}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {binProducts.map((row) => {
                const variantLabel = variantAttributesLabel(row.variant);
                return (
                  <li key={row.placement_id} className="rounded-xl border bg-muted/40 p-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className="min-w-0 truncate text-sm font-medium text-foreground"
                        title={row.product_name}
                      >
                        {row.product_name}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-primary">
                        ×{formatUnits(row.quantity)}
                      </span>
                    </div>
                    {variantLabel && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{variantLabel}</p>
                    )}
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                      {row.variant?.sku ?? row.product_sku}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t('warehouseMap.quantity')}: {formatUnits(row.quantity)} ·{' '}
                      {t('warehouseMap.allocated')}: {formatUnits(row.allocated_hint)} ·{' '}
                      {t('warehouseMap.available')}: {formatUnits(row.available_quantity)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-1.5 text-[11px] text-muted-foreground">{t('warehouseMap.hintsNote')}</p>
        </div>
      )}
    </CardSection>
  );
}
