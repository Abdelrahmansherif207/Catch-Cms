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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import type { ApiErrorResponse } from '@/shared/api';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import {
  locationCreateFormSchema,
  locationCreateFormDefaults,
  locationEditFormSchema,
  toCreateApiFormat,
  toUpdateApiFormat,
  type LocationCreateFormValues,
  type LocationEditFormValues,
} from '../schemas/location.schema';
import { useCreateLocation, useLocations, useUpdateLocation } from '../hooks/use-locations';
import type { LocationType, WarehouseLocation } from '../types/location.types';

interface LocationFormDialogProps {
  /** Pass a location to edit; null/undefined creates. */
  location?: WarehouseLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type CreateFormInput = z.input<typeof locationCreateFormSchema>;
type EditFormInput = z.input<typeof locationEditFormSchema>;

/** Backend 422s arrive with snake_case keys — remap to the form's camelCase. */
function normalizeServerErrors(
  errors: Record<string, string[]>
): Record<string, string[]> {
  const keyMap: Record<string, string> = {
    warehouse_id: 'warehouseId',
    parent_id: 'parentId',
  };
  const normalized: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors)) {
    normalized[keyMap[key] ?? key] = value;
  }
  return normalized;
}

export function LocationFormDialog({
  location,
  open,
  onOpenChange,
  onSuccess,
}: LocationFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(location);
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const createForm = useForm<CreateFormInput, unknown, LocationCreateFormValues>({
    resolver: zodResolver(locationCreateFormSchema),
    defaultValues: locationCreateFormDefaults,
  });

  const editForm = useForm<EditFormInput, unknown, LocationEditFormValues>({
    resolver: zodResolver(locationEditFormSchema),
    defaultValues: { name: '', parentId: '', barcode: '', type: '', priority: '' },
  });

  // Warehouse picker (name labels) — reused from the warehouses feature.
  const warehousesQuery = useWarehouses({ limit: 100 });
  const warehouses = warehousesQuery.data?.data ?? [];

  /**
   * Parent options are SERVER-FILTERED by the backend contract
   * (GET /admin/locations?warehouse_id=X), matching the same-warehouse
   * parenting rule instead of filtering a full list client-side.
   * The selected row itself is excluded only as a UI nicety (self-parent
   * is never valid).
   */
  const parentQuery = useLocations({
    limit: 100,
    warehouseId: location
      ? (location.warehouse_id ?? null)
      : createForm.watch('warehouseId') || null,
  });
  const parentOptions = (parentQuery.data?.data ?? []).filter(
    (entry) => !location || entry.id !== location.id
  );

  // Subscribe to the warehouse choice so the form re-renders while picking it.
  const selectedWarehouseId = createForm.watch('warehouseId');

  useEffect(() => {
    if (!open) return;
    setServerErrors({});
    if (location) {
      editForm.reset({
        name: location.name,
        parentId: location.parent_id ? String(location.parent_id) : '',
        barcode: location.barcode ?? '',
        type: (location.type as LocationType | null) ?? '',
        priority: location.priority === null ? '' : String(location.priority),
      });
    } else {
      createForm.reset(locationCreateFormDefaults);
    }
  }, [open, location, createForm, editForm]);

  // Clearing the parent whenever the warehouse choice changes (create mode):
  // the cross-warehouse parent is a guaranteed server 422.
  useEffect(() => {
    if (!open || location) return;
    createForm.setValue('parentId', '');
  }, [open, location, createForm, selectedWarehouseId]);

  const handleServerError = (error: unknown) => {
    const apiError = error as ApiErrorResponse;
    if (apiError?.status === 422 && apiError.errors) {
      setServerErrors(normalizeServerErrors(apiError.errors));
    }
  };

  const onCreateSubmit = (values: LocationCreateFormValues) => {
    setServerErrors({});
    createMutation.mutate(toCreateApiFormat(values), {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
      onError: handleServerError,
    });
  };

  const onEditSubmit = (values: LocationEditFormValues) => {
    setServerErrors({});
    if (!location) return;
    updateMutation.mutate(
      { id: location.id, payload: toUpdateApiFormat(values) },
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

  const renderTypeLabel = (value: string) =>
    value ? t(`locations.types.${value}`) : t('locations.unclassified');

  const renderWarehouseSelect = (
    form: typeof createForm,
    disabled: boolean
  ) => {
    const value = form.watch('warehouseId');
    const selectedWarehouse = warehouses.find((wh) => String(wh.id) === String(value));
    return (
      <Select
        disabled={disabled}
        value={value}
        onValueChange={(v) => form.setValue('warehouseId', v ?? '')}
      >
        <SelectTrigger className="h-9">
          <SelectValue>
            {selectedWarehouse
              ? selectedWarehouse.name
              : t('locations.warehousePlaceholder')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {warehouses.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t('common.noData')}
            </div>
          ) : (
            warehouses.map((wh) => (
              <SelectItem key={wh.id} value={String(wh.id)}>
                {wh.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  };

  const renderParentSelect = (
    formState: { watch: (name: 'parentId') => string; setValue: (name: 'parentId', value: string) => void }
  ) => {
    const value = formState.watch('parentId');
    return (
      <Select
        value={value || 'none'}
        onValueChange={(v) => formState.setValue('parentId', v === 'none' ? '' : (v ?? ''))}
      >
        <SelectTrigger className="h-9">
          <SelectValue>
            {value
              ? (() => {
                  const parent = parentOptions.find((entry) => String(entry.id) === value);
                  return parent ? `${parent.code} — ${parent.name}` : `#${value}`;
                })()
              : t('locations.parentPlaceholder')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t('locations.parentPlaceholder')}</SelectItem>
          {parentQuery.isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">…</div>
          ) : (
            parentOptions.map((entry) => (
              <SelectItem key={entry.id} value={String(entry.id)}>
                <span className="font-mono">{entry.code}</span>
                <span className="ms-2">{entry.name}</span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('locations.editTitle') : t('locations.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('locations.formDescription')}</DialogDescription>
        </DialogHeader>

        {isEdit && location ? (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4" noValidate>
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t('locations.editScopeNote')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('locations.warehouse')}</Label>
                <Input value={String(location.warehouse_id)} disabled />
                {renderError('warehouseId')}
              </div>
              <div className="space-y-1.5">
                <Label>{t('locations.code')}</Label>
                <Input value={location.code} disabled className="font-mono" />
                {renderError('code')}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location-edit-name">{t('locations.name')} *</Label>
              <Input
                id="location-edit-name"
                {...editForm.register('name')}
                placeholder={t('locations.namePlaceholder')}
                aria-invalid={Boolean(editErrors.name)}
              />
              {editErrors.name && (
                <p className="text-xs text-destructive">{t(editErrors.name.message ?? '')}</p>
              )}
              {renderError('name')}
            </div>

            <div className="space-y-1.5">
              <Label>{t('locations.parent')}</Label>
              {renderParentSelect(editForm)}
              {editErrors.parentId && (
                <p className="text-xs text-destructive">{t(editErrors.parentId.message ?? '')}</p>
              )}
              <p className="text-xs text-muted-foreground">{t('locations.parentHint')}</p>
              {renderError('parentId')}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('locations.type')}</Label>
                <Select
                  value={editForm.watch('type') || 'none'}
                  onValueChange={(v) =>
                    editForm.setValue(
                      'type',
                      (v === 'none' ? '' : (v ?? '')) as LocationEditFormValues['type']
                    )
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue>
                      {renderTypeLabel(editForm.watch('type') ?? '')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('locations.unclassified')}</SelectItem>
                    {(Object.keys(t('locations.types', { returnObjects: true }) as Record<string, string>) as LocationType[]).map((typeKey) => (
                      <SelectItem key={typeKey} value={typeKey}>
                        {t(`locations.types.${typeKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderError('type')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location-edit-priority">{t('locations.priority')}</Label>
                <Input
                  id="location-edit-priority"
                  {...editForm.register('priority')}
                  placeholder={t('locations.priorityPlaceholder')}
                  inputMode="numeric"
                  aria-invalid={Boolean(editErrors.priority)}
                />
                {editErrors.priority && (
                  <p className="text-xs text-destructive">{t(editErrors.priority.message ?? '')}</p>
                )}
                <p className="text-xs text-muted-foreground">{t('locations.priorityHint')}</p>
                {renderError('priority')}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location-edit-barcode">{t('locations.barcode')}</Label>
              <Input
                id="location-edit-barcode"
                {...editForm.register('barcode')}
                placeholder={t('locations.barcodePlaceholder')}
              />
              {renderError('barcode')}
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
                <Label>{t('locations.warehouse')} *</Label>
                {renderWarehouseSelect(createForm, false)}
                {createErrors.warehouseId && (
                  <p className="text-xs text-destructive">{t(createErrors.warehouseId.message ?? '')}</p>
                )}
                {renderError('warehouseId')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location-create-code">{t('locations.code')} *</Label>
                <Input
                  id="location-create-code"
                  {...createForm.register('code')}
                  placeholder={t('locations.codePlaceholder')}
                  className="font-mono"
                  aria-invalid={Boolean(createErrors.code)}
                />
                {createErrors.code && (
                  <p className="text-xs text-destructive">{t(createErrors.code.message ?? '')}</p>
                )}
                {renderError('code')}
                <p className="text-xs text-muted-foreground">{t('locations.codeHint')}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location-create-name">{t('locations.name')} *</Label>
              <Input
                id="location-create-name"
                {...createForm.register('name')}
                placeholder={t('locations.namePlaceholder')}
                aria-invalid={Boolean(createErrors.name)}
              />
              {createErrors.name && (
                <p className="text-xs text-destructive">{t(createErrors.name.message ?? '')}</p>
              )}
              {renderError('name')}
            </div>

            <div className="space-y-1.5">
              <Label>{t('locations.parent')}</Label>
              {renderParentSelect(createForm)}
              {createErrors.parentId && (
                <p className="text-xs text-destructive">{t(createErrors.parentId.message ?? '')}</p>
              )}
              <p className="text-xs text-muted-foreground">{t('locations.parentHint')}</p>
              {renderError('parentId')}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('locations.type')}</Label>
                <Select
                  value={createForm.watch('type') || 'none'}
                  onValueChange={(v) =>
                    createForm.setValue(
                      'type',
                      (v === 'none' ? '' : (v ?? '')) as LocationCreateFormValues['type']
                    )
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue>
                      {renderTypeLabel(createForm.watch('type') ?? '')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('locations.unclassified')}</SelectItem>
                    {(Object.keys(t('locations.types', { returnObjects: true }) as Record<string, string>) as LocationType[]).map((typeKey) => (
                      <SelectItem key={typeKey} value={typeKey}>
                        {t(`locations.types.${typeKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderError('type')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location-create-priority">{t('locations.priority')}</Label>
                <Input
                  id="location-create-priority"
                  {...createForm.register('priority')}
                  placeholder={t('locations.priorityPlaceholder')}
                  inputMode="numeric"
                  aria-invalid={Boolean(createErrors.priority)}
                />
                {createErrors.priority && (
                  <p className="text-xs text-destructive">{t(createErrors.priority.message ?? '')}</p>
                )}
                <p className="text-xs text-muted-foreground">{t('locations.priorityHint')}</p>
                {renderError('priority')}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location-create-barcode">{t('locations.barcode')}</Label>
              <Input
                id="location-create-barcode"
                {...createForm.register('barcode')}
                placeholder={t('locations.barcodePlaceholder')}
              />
              {renderError('barcode')}
            </div>

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
