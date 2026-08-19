import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/ui/select';
import {
  governorateSchema, governorateDefaults, type GovernorateFormData,
} from '../schemas/shipping.schema';
import { useCreateGovernorate, useUpdateGovernorate, useCountriesAll } from '../hooks/use-shipping';
import type { Governorate } from '../types/shipping.types';
import type { ApiErrorResponse } from '@/shared/api';

interface GovernorateFormDialogProps {
  governorate?: Governorate | null;
  countryId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GovernorateFormDialog({
  governorate,
  countryId,
  open,
  onOpenChange,
  onSuccess,
}: GovernorateFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!governorate;
  const createMutation = useCreateGovernorate();
  const updateMutation = useUpdateGovernorate();
  const { data: countriesData } = useCountriesAll();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const countries = countriesData?.data || [];

  const form = useForm<GovernorateFormData>({
    resolver: zodResolver(governorateSchema),
    defaultValues: { ...governorateDefaults, country_id: countryId || 0 },
  });

  useEffect(() => {
    if (open) {
      setServerErrors({});
      if (isEditing && governorate) {
        form.reset({
          nameEn: governorate.name || '',
          nameAr: governorate.name || '',
          country_id: governorate.country_id,
          status: governorate.status ? '1' : '0',
          shippingPrice: governorate.shipping_price?.price?.toString() || '',
          estimatedDays: governorate.shipping_price?.estimated_days?.toString() || '',
          freeShippingOver: governorate.shipping_price?.free_shipping_over?.toString() || '',
        });
      } else {
        form.reset({ ...governorateDefaults, country_id: countryId || 0 });
      }
    }
  }, [open, isEditing, governorate, countryId, form]);

  const onSubmit = (values: GovernorateFormData) => {
    setServerErrors({});
    const payload: Record<string, unknown> = {
      name: { en: values.nameEn, ar: values.nameAr },
      country_id: values.country_id,
      status: values.status,
    };
    if (values.shippingPrice || values.estimatedDays) {
      payload.shipping_price = {
        price: Number(values.shippingPrice) || 0,
        estimated_days: Number(values.estimatedDays) || 0,
        free_shipping_over: values.freeShippingOver ? Number(values.freeShippingOver) : undefined,
      };
    }

    const onError = (error: unknown) => {
      const apiError = error as ApiErrorResponse;
      if (apiError?.status === 422 && apiError.errors) {
        setServerErrors(apiError.errors);
      }
    };

    if (isEditing && governorate) {
      updateMutation.mutate({ id: governorate.id, data: payload as never }, { onSuccess: () => { onSuccess(); onOpenChange(false); }, onError });
    } else {
      createMutation.mutate(payload as never, { onSuccess: () => { onSuccess(); onOpenChange(false); }, onError });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof GovernorateFormData]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0]
      || serverErrors['name.en']?.[0] || serverErrors['name.ar']?.[0]
      || serverErrors['shipping_price.price']?.[0] || serverErrors['shipping_price.estimated_days']?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('shipping.editGovernorate') : t('shipping.createGovernorate')}</DialogTitle>
          <DialogDescription>{t('shipping.governorateFormSubtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('shipping.nameEn')} *</label>
              <Input {...form.register('nameEn')} />
              {getError('nameEn') && <p className="text-xs text-destructive">{getError('nameEn')}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('shipping.nameAr')} *</label>
              <Input {...form.register('nameAr')} dir="rtl" />
              {getError('nameAr') && <p className="text-xs text-destructive">{getError('nameAr')}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('shipping.country')} *</label>
            <Select
              value={form.watch('country_id').toString()}
              onValueChange={(v) => form.setValue('country_id', Number(v))}
            >
              <SelectTrigger><SelectValue placeholder={t('shipping.selectCountry')} /></SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getError('country_id') && <p className="text-xs text-destructive">{getError('country_id')}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('shipping.status')}</label>
            <Select value={form.watch('status')} onValueChange={(v) => v && form.setValue('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('shipping.active')}</SelectItem>
                <SelectItem value="0">{t('shipping.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <fieldset className="rounded-lg border p-4 space-y-3">
            <legend className="text-sm font-medium px-1">{t('shipping.shippingPriceInfo')}</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('shipping.price')}</label>
                <Input type="number" {...form.register('shippingPrice')} placeholder="50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('shipping.estimatedDays')}</label>
                <Input type="number" {...form.register('estimatedDays')} placeholder="2" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('shipping.freeShippingOver')}</label>
                <Input type="number" {...form.register('freeShippingOver')} placeholder="500" />
              </div>
            </div>
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? t('shipping.update') : t('shipping.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
