import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

type OrderTone = 'warning' | 'info' | 'success' | 'destructive' | 'muted';

const ORDER_TONES: Record<string, OrderTone> = {
  pending: 'warning',
  processing: 'warning',
  completed: 'success',
  delivered: 'info',
  cancelled: 'destructive',
};

const PAYMENT_TONES: Record<string, OrderTone> = {
  'payment-success': 'success',
  'payment-pending': 'warning',
  'payment-failed': 'destructive',
};

const TONE_CLASSES: Record<OrderTone, string> = {
  success: 'border-transparent bg-success-soft text-success',
  warning: 'border-transparent bg-warning-soft text-warning',
  destructive: 'border-transparent bg-destructive-soft text-destructive',
  info: 'border-transparent bg-info-soft text-info',
  muted: 'border-transparent bg-muted text-muted-foreground',
};

interface OrderStatusBadgeProps {
  status: string;
  type?: 'order' | 'payment';
  className?: string;
}

/**
 * Order / payment status pill driven by semantic tokens with translated labels.
 * Unknown statuses fall back to a neutral muted tone (never unstyled).
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
