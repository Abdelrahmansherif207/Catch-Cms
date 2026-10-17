import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { TONE_CLASSES, type StatusTone } from '../utils/order-status';

const FULFILLMENT_TONES: Record<string, StatusTone> = {
  pending: 'muted',
  processing: 'info',
  picking: 'cyan',
  packing: 'indigo',
  ready_to_ship: 'warning',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'destructive',
};

interface FulfillmentStatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Fulfillment pipeline pill (pending → picking → packing → ready_to_ship →
 * shipped → delivered). Unknown statuses fall back to a neutral muted tone.
 */
export function FulfillmentStatusBadge({ status, className }: FulfillmentStatusBadgeProps) {
  const { t } = useTranslation();
  const tone = FULFILLMENT_TONES[status] ?? 'muted';
  const label = t(`orders.fulfillmentStatuses.${status}`, { defaultValue: status });

  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone], className)}>
      {label}
    </Badge>
  );
}
