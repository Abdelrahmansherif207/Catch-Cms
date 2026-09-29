import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useOrderStatusOptions, useUpdateOrderStatus } from '../hooks/use-orders';
import { getLocalizedName } from '@/shared/lib/localize';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import type { FlowStatusOption } from '../types/order.types';
import { TransitionInputsDialog } from './transition-inputs-dialog';

interface OrderStatusSelectProps {
  orderId: number;
  currentStatus: string;
}

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: OrderStatusSelectProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const { can } = usePermissions();
  const updateMutation = useUpdateOrderStatus();
  const { data: optionsData, isLoading } = useOrderStatusOptions(orderId);
  const [inputsTarget, setInputsTarget] = useState<FlowStatusOption | null>(null);

  const options = optionsData?.data?.statuses;

  const candidates = (options ?? []).filter((s) => s.code !== currentStatus);

  const pickTarget = (option: FlowStatusOption) => {
    if (!option.allowed) return;
    if (option.requires_inputs.length > 0) {
      setInputsTarget(option);
      return;
    }
    updateMutation.mutate({ id: orderId, status: option.code });
  };

  const handleValueChange = (value: unknown) => {
    if (!value || value === currentStatus || updateMutation.isPending) return;
    const option = candidates.find((s) => s.code === value);
    if (option) pickTarget(option);
  };

  // Fallback when options endpoint hasn't loaded / is unavailable: show current, no candidates.
  const fallbackLabel = t(`orders.statuses.${currentStatus}`, {
    defaultValue: currentStatus,
  });

  return (
    <>
      <Select
        value={currentStatus}
        onValueChange={handleValueChange}
        disabled={updateMutation.isPending || isLoading || !options}
      >
        <SelectTrigger
          className="w-[180px]"
          title={
            can(PERMISSIONS.orders.updateStatus)
              ? t('orders.changeStatus')
              : t('orders.noPermission')
          }
          aria-label={t('orders.changeStatus')}
        >
          <SelectValue placeholder={fallbackLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentStatus} disabled>
            {fallbackLabel}
          </SelectItem>
          {candidates.map((option) => (
            <SelectItem
              key={option.code}
              value={option.code}
              disabled={!option.allowed}
              label={getLocalizedName(option.name, lang)}
            >
              <span className="flex items-center justify-between gap-4">
                <span>{getLocalizedName(option.name, lang)}</span>
                {!option.allowed && option.reason && (
                  <span className="text-xs text-muted-foreground">
                    {t(`orders.reasons.${option.reason}`)}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {inputsTarget && (
        <TransitionInputsDialog
          orderId={orderId}
          option={inputsTarget}
          open={!!inputsTarget}
          onOpenChange={(open) => {
            if (!open) setInputsTarget(null);
          }}
        />
      )}
    </>
  );
}
