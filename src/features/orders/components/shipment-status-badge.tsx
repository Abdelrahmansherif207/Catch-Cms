import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

type ShipmentTone = 'warning' | 'info' | 'success' | 'destructive' | 'muted';

/**
 * The NINE closed shipment states accepted by
 * POST /admin/orders/{orderId}/shipment/update-status.
 */
const SHIPMENT_TONES: Record<string, ShipmentTone> = {
  pending: 'warning',
  label_created: 'info',
  picked_up: 'info',
  in_transit: 'info',
  out_for_delivery: 'warning',
  delivered: 'success',
  failed_delivery: 'destructive',
  returned: 'muted',
  cancelled: 'destructive',
};

const TONE_CLASSES: Record<ShipmentTone, string> = {
  success: 'border-transparent bg-success-soft text-success',
  warning: 'border-transparent bg-warning-soft text-warning',
  destructive: 'border-transparent bg-destructive-soft text-destructive',
  info: 'border-transparent bg-info-soft text-info',
  muted: 'border-transparent bg-muted text-muted-foreground',
};

export function ShipmentStatusBadge({ status, className }: { status: string | null; className?: string }) {
  const { t } = useTranslation();

  if (!status) {
    return (
      <Badge variant="outline" className={cn('font-normal', TONE_CLASSES.muted, className)}>
        {t('orders.noShipment')}
      </Badge>
    );
  }

  const tone = SHIPMENT_TONES[status] ?? 'muted';

  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone], className)}>
      {t(`orders.shipmentStatuses.${status}`, { defaultValue: status })}
    </Badge>
  );
}
