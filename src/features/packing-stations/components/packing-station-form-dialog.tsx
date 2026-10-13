import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import { fetchUsers } from '@/features/users/api/users.api';
import { queryKeys } from '@/shared/lib/query-keys';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCreatePackingStation, useUpdatePackingStation } from '../hooks/use-packing-stations';
import {
  packingStationFormSchema,
  packingStationFormDefaults,
  formValuesFromStation,
  PACKING_STATION_STATUSES,
  type PackingStationFormValues,
} from '../schemas/packing-station.schema';
import type {
  CreatePackingStationData,
  PackingStation,
  UpdatePackingStationData,
} from '../types/packing-station.types';

interface PackingStationFormDialogProps {
  station?: PackingStation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type PackingStationFormInput = z.input<typeof packingStationFormSchema>;

// Sentinel for the "let the backend use the DEFAULT warehouse" choice —
// the API falls back client-side, so we simply omit warehouse_id.
const WAREHOUSE_DEFAULT = 'default';
const OPERATOR_UNASSIGNED = 'unassigned';

export function PackingStationFormDialog({
  station,
  open,
  onOpenChange,
  onSuccess,
}: PackingStationFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!station;
  const createMutation = useCreatePackingStation();
  const updateMutation = useUpdatePackingStation();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const { data: warehousesResponse } = useWarehouses({ limit: 100 });
  const warehouses = useMemo(
    () => warehousesResponse?.data ?? [],
    [warehousesResponse]
  );

  // NB: NOT `can()` — the client-side super_admin role bypasses every
  // check, but the backend still enforces the /users permission pipe, so a
  // role-bypass token would fire a doomed 403 and blank the dropdown. Gate
  // on the raw login grants — exactly what the token can do server-side.
  const rawPermissions = useAuthStore((s) => s.user?.permissions ?? []);
  const canViewAdmins = rawPermissions.includes(PERMISSIONS.users.viewAdmins);
  const { data: usersResponse } = useQuery({
    // Operator options are only fetched while the dialog is open AND the
    // caller may read admin users — avoids a doomed 403 request otherwise.
    queryKey: queryKeys.users.list({ admins: true, perPage: 100 }),
    queryFn: () => fetchUsers({ admins: true, perPage: 100 }),
    enabled: open && canViewAdmins,
    staleTime: 60 * 1000,
  });
  const operators = useMemo(
    () => (canViewAdmins ? (usersResponse?.data?.data ?? []) : []),
    [canViewAdmins, usersResponse]
  );

  const form = useForm<PackingStationFormInput, unknown, PackingStationFormValues>({
    resolver: zodResolver(packingStationFormSchema),
    defaultValues: packingStationFormDefaults,
  });

  useEffect(() => {
    if (open) {
      setServerErrors({});
      if (station) {
        form.reset(formValuesFromStation(station));
      } else {
        form.reset(packingStationFormDefaults);
      }
    }
  }, [open, station, form]);

  const onSubmit = (values: PackingStationFormValues) => {
    setServerErrors({});

    const handleError = (error: unknown) => {
      const apiError = error as { status?: number; errors?: Record<string, string[]> };
      if (apiError?.status === 422 && apiError.errors) {
        setServerErrors(apiError.errors);
      }
    };

    if (isEdit && station) {
      const payload: UpdatePackingStationData = {
        code: values.code,
        name: values.name,
        status: values.status,
        assigned_to: values.assignedTo ?? null,
        daily_capacity: values.dailyCapacity ?? null,
      };
      updateMutation.mutate(
        { id: station.id, payload },
        { onSuccess, onError: handleError }
      );
    } else {
      const payload: CreatePackingStationData = {
        code: values.code,
        name: values.name,
        status: values.status,
        assigned_to: values.assignedTo ?? null,
        daily_capacity: values.dailyCapacity ?? null,
      };
      if (values.warehouseId) payload.warehouse_id = values.warehouseId;
      createMutation.mutate(payload, { onSuccess, onError: handleError });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = (errors as Record<string, { message?: string }>)[field]?.message;
    const serverErr = serverErrors[field]?.[0];
    return clientErr || serverErr;
  };

  const renderError = (message?: string) =>
    message ? <p className="text-xs text-destructive">{t(message)}</p> : null;

  const warehouseFieldError = getError('warehouse_id') || getError('warehouseId');
  const assignedFieldError = getError('assigned_to') || getError('assignedTo');
  const dailyFieldError = getError('daily_capacity') || getError('dailyCapacity');
  const editingWarehouse = warehouses.find((w) => w.id === station?.warehouse_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('packingStations.editTitle') : t('packingStations.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('packingStations.formDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="packing-station-code">{t('packingStations.code')} *</Label>
            <Input
              id="packing-station-code"
              {...form.register('code')}
              placeholder={t('packingStations.codePlaceholder')}
              aria-invalid={!!getError('code')}
            />
            {renderError(getError('code'))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="packing-station-name">{t('packingStations.name')} *</Label>
            <Input
              id="packing-station-name"
              {...form.register('name')}
              placeholder={t('packingStations.namePlaceholder')}
              aria-invalid={!!getError('name')}
            />
            {renderError(getError('name'))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('common.status')}</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) => {
                  if (PACKING_STATION_STATUSES.includes(v as PackingStationFormValues['status'])) {
                    form.setValue('status', v as PackingStationFormValues['status']);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.status')}>
                    {form.watch('status') &&
                      t('packingStations.status.' + form.watch('status'))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PACKING_STATION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t('packingStations.status.' + status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderError(getError('status'))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="packing-station-capacity">
                {t('packingStations.dailyCapacity')}
              </Label>
              <Input
                id="packing-station-capacity"
                type="number"
                min={1}
                {...form.register('dailyCapacity', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
                aria-invalid={!!dailyFieldError}
              />
              {renderError(dailyFieldError)}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('packingStations.warehouse')} {isEdit ? '' : '*'}</Label>
            {isEdit ? (
              <Input value={
                editingWarehouse
                  ? editingWarehouse.name + ' (' + editingWarehouse.code + ')'
                  : t('packingStations.warehouseNofound')
              } readOnly disabled />
            ) : (
              <Select
                value={form.watch('warehouseId')
                  ? String(form.watch('warehouseId'))
                  : WAREHOUSE_DEFAULT}
                onValueChange={(v) => {
                  form.setValue(
                    'warehouseId',
                    v === WAREHOUSE_DEFAULT ? undefined : Number(v)
                  );
                }}
              >
                <SelectTrigger className="w-full" aria-invalid={!!warehouseFieldError}>
                  <SelectValue placeholder={t('packingStations.warehouse')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WAREHOUSE_DEFAULT}>
                    {t('packingStations.defaultWarehouse')}
                  </SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                      {warehouse.name} ({warehouse.code}){warehouse.is_default ? ' ★' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                {t('packingStations.warehouseImmutable')}
              </p>
            )}
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                {t('packingStations.defaultWarehouseHint')}
              </p>
            )}
            {renderError(warehouseFieldError)}
          </div>

          <div className="space-y-1.5">
            <Label>{t('packingStations.assignedTo')}</Label>
            {!canViewAdmins ? (
              <Input
                disabled
                placeholder={t('packingStations.assignedToNoPermission')}
              />
            ) : (
              <Select
                value={
                  form.watch('assignedTo')
                    ? String(form.watch('assignedTo'))
                    : OPERATOR_UNASSIGNED
                }
                onValueChange={(v) => {
                  form.setValue(
                    'assignedTo',
                    v === OPERATOR_UNASSIGNED ? null : Number(v)
                  );
                }}
              >
                <SelectTrigger className="w-full" aria-invalid={!!assignedFieldError}>
                  <SelectValue placeholder={t('packingStations.assignedTo')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OPERATOR_UNASSIGNED}>
                    {t('packingStations.unassigned')}
                  </SelectItem>
                  {operators.map((operator) => (
                    <SelectItem key={operator.id} value={String(operator.id)}>
                      {operator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {renderError(assignedFieldError)}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t('packingStations.saving')
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
