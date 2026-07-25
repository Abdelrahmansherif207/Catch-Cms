import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
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
  pickupLocationFormSchema,
  pickupLocationFormDefaults,
  toApiFormat,
  type PickupLocationFormValues,
} from '../schemas/pickup-location.schema';
import { useCreatePickupLocation, useUpdatePickupLocation } from '../hooks/use-pickup-locations';
import type { PickupLocation } from '../types/pickup-location.types';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface PickupLocationFormDialogProps {
  location?: PickupLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PickupLocationFormDialog({
  location,
  open,
  onOpenChange,
  onSuccess,
}: PickupLocationFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!location;
  const createMutation = useCreatePickupLocation();
  const updateMutation = useUpdatePickupLocation();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const form = useForm<PickupLocationFormValues>({
    resolver: zodResolver(pickupLocationFormSchema) as any,
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
          displayOrder: location.display_order,
          workingHours: location.working_hours || [],
        });
      } else {
        form.reset(pickupLocationFormDefaults);
      }
    }
  }, [open, location, form]);

  const workingHours = form.watch('workingHours') || [];

  const addWorkingHour = () => {
    const hours = [...workingHours, { day: '', open: '', close: '' }];
    form.setValue('workingHours', hours);
  };

  const updateWorkingHour = (index: number, field: 'day' | 'open' | 'close', value: string) => {
    const hours = [...workingHours];
    hours[index] = { ...hours[index], [field]: value };
    form.setValue('workingHours', hours);
  };

  const removeWorkingHour = (index: number) => {
    const hours = workingHours.filter((_, i) => i !== index);
    form.setValue('workingHours', hours);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('pickupLocations.editPickupLocation') : t('pickupLocations.createPickupLocation')}
          </DialogTitle>
          <DialogDescription>
            {t('pickupLocations.formDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('pickupLocations.storeName')} *</label>
              <Input {...form.register('storeName')} placeholder={t('pickupLocations.storeNamePlaceholder')} />
              {getError('storeName') && <p className="text-xs text-destructive">{getError('storeName')}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('pickupLocations.displayOrder')}</label>
              <Input type="number" min={0} {...form.register('displayOrder', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('pickupLocations.address')} *</label>
            <Input {...form.register('address')} placeholder={t('pickupLocations.addressPlaceholder')} />
            {getError('address') && <p className="text-xs text-destructive">{getError('address')}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('pickupLocations.phone')} *</label>
              <Input {...form.register('phone')} placeholder={t('pickupLocations.phonePlaceholder')} />
              {getError('phone') && <p className="text-xs text-destructive">{getError('phone')}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('pickupLocations.email')}</label>
              <Input type="email" {...form.register('email')} placeholder={t('pickupLocations.emailPlaceholder')} />
              {getError('email') && <p className="text-xs text-destructive">{getError('email')}</p>}
            </div>
          </div>

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
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('pickupLocations.active')}</SelectItem>
                <SelectItem value="0">{t('pickupLocations.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('pickupLocations.workingHours')}</label>
              <Button type="button" variant="outline" size="sm" onClick={addWorkingHour}>
                <Plus className="h-3 w-3 me-1" />
                {t('pickupLocations.addHour')}
              </Button>
            </div>
            {workingHours.map((hour, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-muted-foreground">{t('pickupLocations.day')}</label>
                  <Select
                    value={hour.day}
                    onValueChange={(v) => updateWorkingHour(index, 'day', v ?? '')}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 w-24">
                  <label className="text-xs text-muted-foreground">{t('pickupLocations.open')}</label>
                  <Input
                    type="time"
                    value={hour.open}
                    onChange={(e) => updateWorkingHour(index, 'open', e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1 w-24">
                  <label className="text-xs text-muted-foreground">{t('pickupLocations.close')}</label>
                  <Input
                    type="time"
                    value={hour.close}
                    onChange={(e) => updateWorkingHour(index, 'close', e.target.value)}
                    className="h-8"
                  />
                </div>
                <Button type="button" variant="ghost" size="icon-sm" className="mb-0.5" onClick={() => removeWorkingHour(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
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
