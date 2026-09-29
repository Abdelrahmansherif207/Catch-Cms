import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Loader2 } from 'lucide-react';
import { useUpdateOrderStatus } from '../hooks/use-orders';
import { getLocalizedName } from '@/shared/lib/localize';
import type { FlowStatusOption, FlowValues } from '../types/order.types';

interface TransitionInputsDialogProps {
  orderId: number;
  option: FlowStatusOption;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransitionInputsDialog({
  orderId,
  option,
  open,
  onOpenChange,
}: TransitionInputsDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const updateMutation = useUpdateOrderStatus();
  const [values, setValues] = useState<FlowValues>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = () => {
    updateMutation.mutate(
      { id: orderId, status: option.code, flowValues: values },
      {
        onSuccess: () => {
          onOpenChange(false);
          setValues({});
          setFieldErrors({});
        },
        onError: (error) => {
          const apiError = error as {
            data?: { errors?: Record<string, string[]> };
          };
          setFieldErrors(apiError?.data?.errors || {});
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('orders.transitionDialogTitle', {
              status: getLocalizedName(option.name, lang),
            })}
          </DialogTitle>
          <DialogDescription>
            {t('orders.transitionDialogDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {option.requires_inputs.map((key) => (
            <div key={key} className="space-y-1.5">
              <Label>{key}</Label>
              <Input
                value={String(values[key] ?? '')}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
              {fieldErrors[key]?.map((msg) => (
                <p key={msg} className="text-xs text-destructive">
                  {msg}
                </p>
              ))}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending || option.requires_inputs.length === 0}
          >
            {updateMutation.isPending && (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            )}
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
