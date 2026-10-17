import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { ORDER_TONES, PAYMENT_TONES, TONE_CLASSES } from '../utils/order-status';

interface OrderStatusBadgeProps {
  status: string;
  type?: 'order' | 'payment';
  className?: string;
}

/**
 * Order / payment status pill driven by semantic tokens with translated labels.
 * Maps cover backend order-engine statuses (refunded/failed/on_hold) and the
 * payment_status alias expansion (paid/success/PAYMENT_STATUS_*); unknown
 * statuses fall back to a neutral muted tone (never unstyled).
 */
export function OrderStatusBadge({ status, type = 'order', className }: OrderStatusBadgeProps) {
  const { t } = useTranslation();
  const tones = type === 'payment' ? PAYMENT_TONES : ORDER_TONES;
  const tone = tones[status] ?? 'muted';

  const label =
    type === 'payment'
      ? t(`orders.paymentStatuses.${status}`, { defaultValue: status })
      : t(`orders.statuses.${status}`, { defaultValue: status });

  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone], className)}>
      {label}
    </Badge>
  );
}
