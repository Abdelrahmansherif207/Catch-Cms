import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { ShipmentStatus } from '../types/shipment.types';

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus | string;
  className?: string;
}

type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

/** Terminal states render neutral/positive; red is reserved for cancelled. */
const TONES: Record<ShipmentStatus, Tone> = {
  label_created: 'info',
  picked_up: 'info',
  in_transit: 'info',
  out_for_delivery: 'warning',
  delivered: 'success',
  cancelled: 'muted',
};

const TONE_CLASSES: Record<Tone, string> = {
  success: 'border-transparent bg-success-soft text-success',
  warning: 'border-transparent bg-warning-soft text-warning',
  destructive: 'border-transparent bg-destructive-soft text-destructive',
  info: 'border-transparent bg-info-soft text-info',
  muted: 'border-transparent bg-muted text-muted-foreground',
};

export function ShipmentStatusBadge({ status, className }: ShipmentStatusBadgeProps) {
  const { t } = useTranslation();
  const tone = TONES[(status || 'label_created') as ShipmentStatus] ?? 'muted';

  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone], className)}>
      {t('shipments.status.' + status, { defaultValue: status })}
    </Badge>
  );
}
