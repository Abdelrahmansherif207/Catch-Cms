import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useUpdateOrderStatus } from '../hooks/use-orders';
import { getAllowedStatusTransitions } from '../utils/order-status';
import type { OrderStatus } from '../types/order.types';

interface OrderStatusSelectProps {
  orderId: number;
  currentStatus: string;
}

function formatStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: OrderStatusSelectProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateOrderStatus();

  const options = useMemo(
    () => getAllowedStatusTransitions(currentStatus),
    [currentStatus]
  );

  const hasTransitionTarget = options.some(
    (option) => !option.disabled && option.value !== currentStatus
  );

  const handleValueChange = (value: unknown) => {
    if (!value || value === currentStatus || updateMutation.isPending) return;
    updateMutation.mutate({ id: orderId, status: value as OrderStatus });
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleValueChange}
      disabled={updateMutation.isPending || !hasTransitionTarget}
    >
      <SelectTrigger
        className="w-[160px]"
        title={
          hasTransitionTarget
            ? t('orders.changeStatus')
            : t('orders.noTransitions')
        }
        aria-label={t('orders.changeStatus')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            label={formatStatusLabel(option.value)}
          >
            {formatStatusLabel(option.value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
