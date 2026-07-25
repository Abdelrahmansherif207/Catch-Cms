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
  citySchema, cityDefaults, type CityFormData,
} from '../schemas/shipping.schema';
import { useCreateCity, useUpdateCity } from '../hooks/use-shipping';
import type { City } from '../types/shipping.types';
import type { ApiErrorResponse } from '@/shared/api';

interface CityFormDialogProps {
  city?: City | null;
  governorateId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CityFormDialog({
  city,
  governorateId,
  open,
  onOpenChange,
  onSuccess,
}: CityFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!city;
  const createMutation = useCreateCity();
  const updateMutation = useUpdateCity();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const form = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: cityDefaults,
  });

  useEffect(() => {
    if (open) {
      setServerErrors({});
      if (isEditing && city) {
        form.reset({ nameEn: city.name || '', nameAr: city.name || '' });
      } else {
        form.reset(cityDefaults);
      }
    }
  }, [open, isEditing, city, form]);

  const onSubmit = (values: CityFormData) => {
    setServerErrors({});
    const payload = {
      name: { en: values.nameEn, ar: values.nameAr },
      governorate_id: governorateId,
    };

    const onError = (error: unknown) => {
      const apiError = error as ApiErrorResponse;
      if (apiError?.status === 422 && apiError.errors) {
        setServerErrors(apiError.errors);
      }
    };

    if (isEditing && city) {
      updateMutation.mutate({ id: city.id, data: payload }, { onSuccess: () => { onSuccess(); onOpenChange(false); }, onError });
    } else {
      createMutation.mutate(payload, { onSuccess: () => { onSuccess(); onOpenChange(false); }, onError });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof CityFormData]?.message as string | undefined;
    const serverErr = serverErrors['name.en']?.[0] || serverErrors['name.ar']?.[0] || serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('shipping.editCity') : t('shipping.createCity')}</DialogTitle>
          <DialogDescription>{t('shipping.cityFormSubtitle')}</DialogDescription>
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
