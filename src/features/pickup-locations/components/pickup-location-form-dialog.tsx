import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { CalendarCheck } from 'lucide-react';
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
import { Switch } from '@/shared/ui/switch';
import {
  pickupLocationFormSchema,
  pickupLocationFormDefaults,
  toApiFormat,
  weekFromApiHours,
  WEEKDAYS,
  type PickupLocationFormValues,
  type WorkingHourFormValue,
} from '../schemas/pickup-location.schema';
import { PickupLocationMapPicker } from './pickup-location-map-picker';
import { useCreatePickupLocation, useUpdatePickupLocation } from '../hooks/use-pickup-locations';
import type { PickupLocation } from '../types/pickup-location.types';

interface PickupLocationFormDialogProps {
  location?: PickupLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type PickupLocationFormInput = z.input<typeof pickupLocationFormSchema>;

function weekdayLabel(en: string, locale: string): string {
  const index = WEEKDAYS.findIndex((d) => d.en === en);
  if (index === -1) return en;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' }).format(
    new Date(2024, 0, 6 + index)
  );
}

export function PickupLocationFormDialog({
  location,
  open,
  onOpenChange,
  onSuccess,
}: PickupLocationFormDialogProps) {
  const { t, i18n } = useTranslation();
  const isEdit = !!location;
  const createMutation = useCreatePickupLocation();
  const updateMutation = useUpdatePickupLocation();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const form = useForm<PickupLocationFormInput, unknown, PickupLocationFormValues>({
    resolver: zodResolver(pickupLocationFormSchema),
    defaultValues: pickupLocationFormDefaults,
  });

  useEffect(() => {
    if (open) {
      setServerErrors({});
      if (location) {
        form.reset({
          storeName: location.store_name,
          address: location.address,
          phone: location.phone,
          email: location.email || '',
          latitude: location.latitude || '',
          longitude: location.longitude || '',
          status: location.status ? '1' : '0',
          displayOrder: location.display_order ?? 0,
          workingHours: weekFromApiHours(location.working_hours),
        });
      } else {
        form.reset(pickupLocationFormDefaults);
      }
    }
  }, [open, location, form]);

  const workingHours = form.watch('workingHours') ?? [];

  const updateWorkingHour = <K extends keyof WorkingHourFormValue>(
    index: number,
    field: K,
    value: WorkingHourFormValue[K]
  ) => {
    const hours = [...workingHours];
    hours[index] = { ...hours[index], [field]: value };
    form.setValue('workingHours', hours, { shouldValidate: true });
  };

  const toggleEnabled = (index: number, enabled: boolean) => {
    updateWorkingHour(index, 'enabled', enabled);
  };

  const applyToAllOpenDays = () => {
    const source = workingHours.find((h) => h.enabled);
    if (!source) return;
    form.setValue(
      'workingHours',
      workingHours.map((h) => (h.enabled ? { ...h, open: source.open, close: source.close } : h)),
      { shouldValidate: true }
    );
  };

  const onSubmit = (values: PickupLocationFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values);

    const handleError = (error: unknown) => {
      const apiError = error as { status?: number; errors?: Record<string, string[]> };
      if (apiError?.status === 422 && apiError.errors) {
        setServerErrors(apiError.errors);
      }
    };

    if (isEdit && location) {
      updateMutation.mutate(
        { id: location.id, payload: apiData },
        { onSuccess, onError: handleError }
      );
    } else {
      createMutation.mutate(apiData, { onSuccess, onError: handleError });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = (errors as Record<string, { message?: string }>)[field]?.message;
    const serverErr = serverErrors[field]?.[0];
    return clientErr || serverErr;
  };

  const getHourError = (index: number, field: 'day' | 'open' | 'close'): string | undefined => {
    const hourErr = errors.workingHours?.[index];
    const clientErr =
      hourErr && !('ref' in hourErr)
        ? (hourErr as Record<string, { message?: string }>)[field]?.message
        : undefined;
    const serverErr =
      serverErrors[`working_hours.${index}.${field}`]?.[0] ||
      serverErrors[`working_hours.${index}.day.${field}`]?.[0];
    return clientErr || serverErr;
  };

  const renderError = (message?: string) =>
    message ? <p className="text-xs text-destructive">{t(message)}</p> : null;

  const anyOpenDay = workingHours.some((h) => h.enabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('pickupLocations.editPickupLocation') : t('pickupLocations.createPickupLocation')}
          </DialogTitle>
          <DialogDescription>
            {t('pickupLocations.formDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('pickupLocations.storeName')} *</label>
              <Input {...form.register('storeName')} placeholder={t('pickupLocations.storeNamePlaceholder')} />
              {renderError(getError('storeName'))}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('pickupLocations.displayOrder')}</label>
              <Input type="number" min={0} {...form.register('displayOrder', { valueAsNumber: true })} />
              {renderError(getError('display_order') || getError('displayOrder'))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('pickupLocations.address')} *</label>
            <Input {...form.register('address')} placeholder={t('pickupLocations.addressPlaceholder')} />
            {renderError(getError('address'))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('pickupLocations.phone')} *</label>
              <Input {...form.register('phone')} placeholder={t('pickupLocations.phonePlaceholder')} />
              {renderError(getError('phone'))}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('pickupLocations.email')}</label>
              <Input type="email" {...form.register('email')} placeholder={t('pickupLocations.emailPlaceholder')} />
              {renderError(getError('email'))}
            </div>
          </div>

          <PickupLocationMapPicker
            latitude={form.watch('latitude')}
            longitude={form.watch('longitude')}
            onChange={(lat, lng) => {
              form.setValue('latitude', lat);
              form.setValue('longitude', lng);
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('pickupLocations.latitude')}</label>
                <Input {...form.register('latitude')} placeholder="30.0444" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('pickupLocations.longitude')}</label>
                <Input {...form.register('longitude')} placeholder="31.2357" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('pickupLocations.status')}</label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) => v && form.setValue('status', v)}
              >
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('pickupLocations.active')}</SelectItem>
                  <SelectItem value="0">{t('pickupLocations.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('pickupLocations.workingHours')}</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!anyOpenDay || isPending}
                onClick={applyToAllOpenDays}
              >
                <CalendarCheck className="h-3 w-3 me-1" />
                {t('pickupLocations.applyToAllDays')}
              </Button>
            </div>
            <div className="rounded-lg border divide-y overflow-hidden">
              {workingHours.map((hour, index) => (
                <div
                  key={hour.day.en}
                  className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 ${
                    hour.enabled ? '' : 'bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={hour.enabled}
                      onCheckedChange={(checked) => toggleEnabled(index, checked === true)}
                      aria-label={hour.day.en}
                    />
                    <span
                      className={`w-28 text-sm shrink-0 ${
                        hour.enabled ? 'font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {weekdayLabel(hour.day.en, i18n.language)}
                    </span>
                  </div>
                  {hour.enabled ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="time"
                          value={hour.open}
                          onChange={(e) => updateWorkingHour(index, 'open', e.target.value)}
                          className="h-8 w-36 shrink-0"
                        />
                        <span className="text-xs text-muted-foreground">—</span>
                        <Input
                          type="time"
                          value={hour.close}
                          onChange={(e) => updateWorkingHour(index, 'close', e.target.value)}
                          className="h-8 w-36 shrink-0"
                        />
                      </div>
                      {renderError(getHourError(index, 'open') || getHourError(index, 'close'))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t('pickupLocations.closedAllDay')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t('pickupLocations.saving')
                : isEdit
                  ? t('common.update')
                  : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
