import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { LOCATION_TYPES } from '@/features/locations/types/location.types';
import { LOCATION_TYPE_STYLES, UNTYPED_BIN_STYLE } from '../lib/bin-style';

/** Type-color key for the map sidebar. */
export function MapLegend() {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card">
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {t('warehouseMap.legendTitle')}
      </h3>
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        {LOCATION_TYPES.map((type) => (
          <li key={type} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', LOCATION_TYPE_STYLES[type].dot)} />
            <span className="truncate">{t(`locations.types.${type}`)}</span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', UNTYPED_BIN_STYLE.dot)} />
          <span className="truncate">{t('locations.unclassified')}</span>
        </li>
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {t('warehouseMap.legendInactiveNote')}
      </p>
    </section>
  );
}
