import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
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
import { Switch } from '@/shared/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import type { ApiErrorResponse } from '@/shared/api';
import {
  warehouseCreateFormSchema,
  warehouseCreateFormDefaults,
  warehouseEditFormSchema,
  toCreateApiFormat,
  toUpdateApiFormat,
  type WarehouseCreateFormValues,
  type WarehouseEditFormValues,
} from '../schemas/warehouse.schema';
import { useCreateWarehouse, useUpdateWarehouse } from '../hooks/use-warehouses';
import type { Warehouse } from '../types/warehouse.types';

interface WarehouseFormDialogProps {
  /** Pass a warehouse to edit; null/undefined creates. */
  warehouse?: Warehouse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type CreateFormInput = z.input<typeof warehouseCreateFormSchema>;
type EditFormInput = z.input<typeof warehouseEditFormSchema>;

export function WarehouseFormDialog({
  warehouse,
  open,
  onOpenChange,
  onSuccess,
}: WarehouseFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(warehouse);
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const createForm = useForm<CreateFormInput, unknown, WarehouseCreateFormValues>({
    resolver: zodResolver(warehouseCreateFormSchema),
    defaultValues: warehouseCreateFormDefaults,
  });

  const editForm = useForm<EditFormInput, unknown, WarehouseEditFormValues>({
    resolver: zodResolver(warehouseEditFormSchema),
    defaultValues: { name: '', address: '', city: '', country: '' },
  });

  useEffect(() => {
    if (!open) return;
    setServerErrors({});
    if (warehouse) {
      editForm.reset({
        name: warehouse.name,
        address: warehouse.address ?? '',
        city: warehouse.city ?? '',
        country: warehouse.country ?? '',
      });
    } else {
      createForm.reset(warehouseCreateFormDefaults);
    }
  }, [open, warehouse, editForm, createForm]);

  const handleServerError = (error: unknown) => {
    const apiError = error as ApiErrorResponse;
    if (apiError?.status === 422 && apiError.errors) {
      setServerErrors(apiError.errors);
    }
  };

  const onCreateSubmit = (values: WarehouseCreateFormValues) => {
    setServerErrors({});
    createMutation.mutate(toCreateApiFormat(values), {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
      onError: handleServerError,
    });
  };

  const onEditSubmit = (values: WarehouseEditFormValues) => {
    setServerErrors({});
    if (!warehouse) return;
    updateMutation.mutate(
      { id: warehouse.id, payload: toUpdateApiFormat(values) },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
        onError: handleServerError,
      }
    );
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const renderError = (field: string) => {
    const server = serverErrors[field]?.[0];
    return server ? <p className="text-xs text-destructive">{server}</p> : null;
  };

  const createErrors = createForm.formState.errors;
  const editErrors = editForm.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('warehouses.editTitle') : t('warehouses.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('warehouses.formDescription')}</DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4" noValidate>
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t('warehouses.editScopeNote', { code: warehouse?.code })}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="warehouse-name">{t('warehouses.name')} *</Label>
              <Input
                id="warehouse-name"
                {...editForm.register('name')}
                aria-invalid={Boolean(editErrors.name)}
              />
              {editErrors.name && (
                <p className="text-xs text-destructive">{t(editErrors.name.message ?? '')}</p>
              )}
              {renderError('name')}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="warehouse-address">{t('warehouses.address')}</Label>
              <Input
                id="warehouse-address"
                {...editForm.register('address')}
                placeholder={t('warehouses.addressPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="warehouse-city">{t('warehouses.city')}</Label>
                <Input
                  id="warehouse-city"
                  {...editForm.register('city')}
                  placeholder={t('warehouses.cityPlaceholder')}
                  aria-invalid={Boolean(editErrors.city)}
                />
                {editErrors.city && (
                  <p className="text-xs text-destructive">{t(editErrors.city.message ?? '')}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="warehouse-country">{t('warehouses.country')}</Label>
                <Input
                  id="warehouse-country"
                  {...editForm.register('country')}
                  placeholder={t('warehouses.countryPlaceholder')}
                  aria-invalid={Boolean(editErrors.country)}
                />
                {editErrors.country && (
                  <p className="text-xs text-destructive">{t(editErrors.country.message ?? '')}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('common.updating') : t('common.update')}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="warehouse-code">{t('warehouses.code')} *</Label>
                <Input
                  id="warehouse-code"
                  {...createForm.register('code')}
                  placeholder={t('warehouses.codePlaceholder')}
                  aria-invalid={Boolean(createErrors.code)}
                />
                {createErrors.code && (
                  <p className="text-xs text-destructive">{t(createErrors.code.message ?? '')}</p>
                )}
                {renderError('code')}
                <p className="text-xs text-muted-foreground">{t('warehouses.codeHint')}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="warehouse-create-name">{t('warehouses.name')} *</Label>
                <Input
                  id="warehouse-create-name"
                  {...createForm.register('name')}
                  placeholder={t('warehouses.namePlaceholder')}
                  aria-invalid={Boolean(createErrors.name)}
                />
                {createErrors.name && (
                  <p className="text-xs text-destructive">{t(createErrors.name.message ?? '')}</p>
                )}
                {renderError('name')}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="warehouse-create-address">{t('warehouses.address')}</Label>
              <Input
                id="warehouse-create-address"
                {...createForm.register('address')}
                placeholder={t('warehouses.addressPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="warehouse-create-city">{t('warehouses.city')}</Label>
                <Input
                  id="warehouse-create-city"
                  {...createForm.register('city')}
                  placeholder={t('warehouses.cityPlaceholder')}
                  aria-invalid={Boolean(createErrors.city)}
                />
                {createErrors.city && (
                  <p className="text-xs text-destructive">{t(createErrors.city.message ?? '')}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="warehouse-create-country">{t('warehouses.country')}</Label>
                <Input
                  id="warehouse-create-country"
                  {...createForm.register('country')}
                  placeholder={t('warehouses.countryPlaceholder')}
                  aria-invalid={Boolean(createErrors.country)}
                />
                {createErrors.country && (
                  <p className="text-xs text-destructive">{t(createErrors.country.message ?? '')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('common.status')}</Label>
                <Select
                  value={createForm.watch('status')}
                  onValueChange={(v) => {
                    if (v === 'active' || v === 'inactive') createForm.setValue('status', v);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue>
                      {createForm.watch('status') === 'inactive'
                        ? t('common.inactive')
                        : t('common.active')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('common.active')}</SelectItem>
                    <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 self-end pb-1.5">
                <Switch
                  id="warehouse-is-default"
                  checked={createForm.watch('isDefault') === true}
                  onCheckedChange={(checked) => createForm.setValue('isDefault', checked === true)}
                />
                <Label htmlFor="warehouse-is-default" className="cursor-pointer">
                  {t('warehouses.makeDefault')}
                </Label>
              </div>
            </div>
            {createErrors.isDefault && (
              <p className="text-xs text-destructive">{t(createErrors.isDefault.message ?? '')}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('common.creating') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
