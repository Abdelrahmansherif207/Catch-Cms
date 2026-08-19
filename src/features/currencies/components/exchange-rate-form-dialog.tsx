import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import {
  exchangeRateFormSchema,
  exchangeRateFormDefaults,
  type ExchangeRateFormValues,
} from '../schemas/exchange-rate.schema';
import { useCreateExchangeRate, useUpdateExchangeRate } from '../hooks/use-currencies';
import type { ExchangeRate } from '../types/currency.types';

interface ExchangeRateFormDialogProps {
  rate?: ExchangeRate | null;
  currencyId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExchangeRateFormDialog({
  rate,
  currencyId,
  open,
  onOpenChange,
  onSuccess,
}: ExchangeRateFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!rate;

  const form = useForm<ExchangeRateFormValues>({
    resolver: zodResolver(exchangeRateFormSchema),
    defaultValues: exchangeRateFormDefaults,
  });

  useEffect(() => {
    if (open) {
      if (isEditing && rate) {
        form.reset({
          effective_date: rate.effective_date.split('T')[0],
          exchange_rate: rate.exchange_rate,
        });
      } else {
        form.reset(exchangeRateFormDefaults);
      }
    }
  }, [open, isEditing, rate, form]);

  const createMutation = useCreateExchangeRate();
  const updateMutation = useUpdateExchangeRate();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: ExchangeRateFormValues) => {
    try {
      if (isEditing && rate) {
        await updateMutation.mutateAsync({
          id: rate.id,
          data: {
            effective_date: data.effective_date,
            exchange_rate: data.exchange_rate,
          },
        });
        toast.success(t('currencyRates.updated'));
      } else {
        await createMutation.mutateAsync({
          currency_id: currencyId,
          effective_date: data.effective_date,
          exchange_rate: data.exchange_rate,
        });
        toast.success(t('currencyRates.created'));
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Errors handled by mutation onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('exchangeRateForm.editTitle') : t('exchangeRateForm.createTitle')}</DialogTitle>
          <DialogDescription>{isEditing ? t('exchangeRateForm.editSubtitle') : t('exchangeRateForm.createSubtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="effectiveDate" className="text-sm font-medium">{t('exchangeRateForm.effectiveDate')}</label>
            <Input
              id="effectiveDate"
              type="date"
              {...form.register('effective_date')}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="exchangeRate" className="text-sm font-medium">{t('exchangeRateForm.exchangeRate')}</label>
            <Input
              id="exchangeRate"
              type="number"
              step="0.0001"
              min="0"
              {...form.register('exchange_rate', { valueAsNumber: true })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending
                ? (isEditing ? t('common.updating') : t('common.creating'))
                : (isEditing ? t('common.update') : t('common.create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
