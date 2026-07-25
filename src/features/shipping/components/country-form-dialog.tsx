import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  countrySchema,
  countryDefaults,
  type CountryFormData,
} from '../schemas/shipping.schema';
import { useCreateCountry, useUpdateCountry } from '../hooks/use-shipping';
import type { Country } from '../types/shipping.types';
import type { ApiErrorResponse } from '@/shared/api';

interface CountryFormDialogProps {
  country?: Country | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CountryFormDialog({
  country,
  open,
  onOpenChange,
  onSuccess,
}: CountryFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!country;
  const createMutation = useCreateCountry();
  const updateMutation = useUpdateCountry();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const form = useForm<CountryFormData>({
    resolver: zodResolver(countrySchema),
    defaultValues: countryDefaults,
  });

  useEffect(() => {
    if (open && !isEditing) {
      setServerErrors({});
      form.reset(countryDefaults);
    }
    if (open && isEditing && country) {
      setServerErrors({});
      form.setValue('nameEn', country.name || '');
      form.setValue('nameAr', country.name || '');
      form.setValue('phone_code', country.phone_code);
      form.setValue('status', country.status ? '1' : '0');
    }
  }, [open, isEditing, country, form]);

  const onSubmit = (values: CountryFormData) => {
    setServerErrors({});
    const payload = {
      name: { en: values.nameEn, ar: values.nameAr },
      phone_code: values.phone_code,
      status: values.status,
    };

    const onError = (error: unknown) => {
      const apiError = error as ApiErrorResponse;
      if (apiError?.status === 422 && apiError.errors) {
        setServerErrors(apiError.errors);
      }
    };

    if (isEditing && country) {
      updateMutation.mutate({ id: country.id, data: payload }, { onSuccess: () => { onSuccess(); onOpenChange(false); }, onError });
    } else {
      createMutation.mutate(payload, { onSuccess: () => { onSuccess(); onOpenChange(false); }, onError });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof CountryFormData]?.message as string | undefined;
    const serverErr = serverErrors['name.en']?.[0] || serverErrors['name.ar']?.[0] || serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('shipping.editCountry') : t('shipping.createCountry')}</DialogTitle>
          <DialogDescription>{t('shipping.countryFormSubtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('shipping.nameEn')} *</label>
              <Input {...form.register('nameEn')} placeholder={t('shipping.nameEn')} />
              {getError('nameEn') && <p className="text-xs text-destructive">{getError('nameEn')}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('shipping.nameAr')} *</label>
              <Input {...form.register('nameAr')} placeholder={t('shipping.nameAr')} dir="rtl" />
              {getError('nameAr') && <p className="text-xs text-destructive">{getError('nameAr')}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('shipping.phoneCode')} *</label>
            <Input {...form.register('phone_code')} placeholder="20" />
            {getError('phone_code') && <p className="text-xs text-destructive">{getError('phone_code')}</p>}
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
