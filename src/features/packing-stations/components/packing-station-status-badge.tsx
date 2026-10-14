import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { PackingStationStatus } from '../types/packing-station.types';

interface PackingStationStatusBadgeProps {
  status: PackingStationStatus | string;
  className?: string;
}

// NB: the backend has THREE lifecycle states — `maintenance` sits between
// `active` and `inactive` and reuses the warning/amber semantics.
const STYLES: Record<PackingStationStatus, string> = {
  active: 'border-transparent bg-success-soft text-success',
  inactive: 'border-transparent bg-muted text-muted-foreground',
  maintenance: 'border-transparent bg-warning-soft text-warning',
};

export function PackingStationStatusBadge({ status, className }: PackingStationStatusBadgeProps) {
  const { t } = useTranslation();
  const normalized = (status || 'inactive') as PackingStationStatus;

  return (
    <Badge variant="outline" className={cn('font-normal', STYLES[normalized], className)}>
      {t('packingStations.status.' + normalized)}
    </Badge>
  );
}
