import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { FulfillmentStatus } from '../types/fulfillment.types';

interface FulfillmentStatusBadgeProps {
  status: FulfillmentStatus | string;
  className?: string;
}

type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

/** Eight-state lifecycle — cancelled renders neutral, never red. */
const TONES: Record<FulfillmentStatus, Tone> = {
  pending: 'warning',
  picking: 'info',
  picked: 'success',
  packing: 'warning',
  ready_to_ship: 'info',
  shipped: 'info',
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

export function FulfillmentStatusBadge({ status, className }: FulfillmentStatusBadgeProps) {
  const { t } = useTranslation();
  const tone = TONES[(status || 'pending') as FulfillmentStatus] ?? 'muted';

  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone], className)}>
      {t('fulfillments.status.' + status, { defaultValue: status })}
    </Badge>
  );
}
