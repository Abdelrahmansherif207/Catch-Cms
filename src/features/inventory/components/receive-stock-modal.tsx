import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { PackagePlus, Loader2, Pencil, Info } from 'lucide-react';
import { useLocations } from '@/features/locations/hooks/use-locations';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import type { ApiErrorResponse } from '@/shared/api';
import type { WarehouseLocation } from '@/features/locations/types/location.types';
import {
  isStockCapableBin,
  variantLabel,
  type PickerVariant,
  type ReceiveStockData,
} from '../types/inventory.types';
import { useReceiveStock } from '../hooks/use-inventory';
import {
  receiveStockFormSchema,
  receiveStockFormDefaults,
  emptyToNull,
  type ReceiveStockFormValues,
} from '../schemas/inventory.schema';
import type { StockOperationResultData } from '../types/inventory.types';
import { ProductPickerList } from './product-picker-list';
import { StockOperationSummary } from './stock-operation-summary';

/** Server keys are snake_case; form fields are camelCase. */
const SERVER_FIELD_MAP: Record<string, keyof ReceiveStockFormValues> = {
  product_id: 'productId',
  location_id: 'locationId',
  quantity: 'quantity',
  reference: 'reference',
};

/** Deterministic-enough replay key (≤64 chars as the server rule caps). */
function generateIdempotencyKey(): string {
  return `ui-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface ReceiveStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fixed bin (opened from the location detail page): the select hides. */
  lockedLocationId?: number | string;
}

/**
 * Receive stock modal (centered), two steps in one dialog:
 * 1. pick ONE receivable product from a filtered page of the products index
 * 2. the stock fields — location bin, quantity, reference — then submit.
 * Result (with Replayed badge) replaces the whole body after success.
 */
export function ReceiveStockModal({
  open,
  onOpenChange,
  lockedLocationId,
}: ReceiveStockModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'pick' | 'details'>('pick');
  const [productId, setProductId] = useState<number | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [productVariants, setProductVariants] = useState<PickerVariant[]>([]);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [variantError, setVariantError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<StockOperationResultData | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);

  // Receipts are PER-SKU (`product_variant_id`, null = simple row): a product
  // with variants always requires one picked SKU — the variable parent row
  // itself is refused by the engine (product_variants guard).
  const needsVariant = productVariants.length > 0;

  const form = useForm<ReceiveStockFormValues>({
    resolver: zodResolver(receiveStockFormSchema),
    defaultValues: receiveStockFormDefaults as ReceiveStockFormValues,
  });

  const { data: locationsData } = useLocations({ limit: 100 });
  const { data: warehousesData } = useWarehouses({ limit: 100 });

  const selectableBins = (locationsData?.data ?? []).filter(
    (location: WarehouseLocation) => isStockCapableBin(location)
  );

  useEffect(() => {
    if (open) {
      setStep('pick');
      setProductId(null);
      setProductName(null);
      setProductVariants([]);
      setVariantId(null);
      setVariantError(undefined);
      setResult(null);
      setIdempotencyKey(generateIdempotencyKey());
      form.reset({
        ...receiveStockFormDefaults,
        locationId: lockedLocationId !== undefined ? String(lockedLocationId) : '',
      } as ReceiveStockFormValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lockedLocationId]);

  const mutation = useReceiveStock();
  const isPending = mutation.isPending;

  const binLabel = (locationId: number | null | undefined) => {
    if (locationId === null || locationId === undefined) return undefined;
    const bin = selectableBins.find(
      (location: WarehouseLocation) => location.id === locationId
    );
    return bin ? `${bin.code} — ${bin.name}` : `#${locationId}`;
  };

  const warehouseLabel = (warehouseId: number | null | undefined) => {
    if (warehouseId === null || warehouseId === undefined) return undefined;
    const warehouse = (warehousesData?.data ?? []).find(
      (item) => String(item.id) === String(warehouseId)
    );
    return warehouse?.name ?? `#${warehouseId}`;
  };

  const onSubmit = (values: ReceiveStockFormValues) => {
    const submitPayload: { locationId: number | string; payload: ReceiveStockData } = {
      locationId: lockedLocationId ?? values.locationId,
      payload: {
        product_id: Number(values.productId),
        product_variant_id: variantId ?? null,
        quantity: Number(values.quantity),
        reference: emptyToNull(values.reference),
        idempotency_key: idempotencyKey,
      },
    };
    mutation.mutate(submitPayload, {
      onSuccess: (response) => {
        setResult(response.data);
      },
      onError: (error) => {
        const apiError = error as unknown as ApiErrorResponse;
        if (apiError?.errors) {
          for (const [serverField, messages] of Object.entries(apiError.errors)) {
            const field = SERVER_FIELD_MAP[serverField];
            if (field && messages.length > 0) {
              form.setError(field, { message: messages[0] });
            }
          }
        }
      },
    });
  };

  const registerError = (field: keyof ReceiveStockFormValues): string | undefined => {
    const message = form.formState.errors[field]?.message as string | undefined;
    return message ? t(message) : undefined;
  };

  // base-ui Select renders the RAW value in the trigger — the selected bin's
  // label must be supplied as SelectValue children (locations-form pattern).
  const selectedBin = selectableBins.find(
    (location: WarehouseLocation) =>
      String(location.id) === form.watch('locationId')
  );

  const submitForm = () => {
    if (needsVariant && variantId === null) {
      setVariantError(t('inventory.variantRequired'));
      return;
    }
    form.handleSubmit(
      onSubmit,
      (errors) => console.warn('[receive] validation blocked:', errors)
    )();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            {t('inventory.receiveTitle')}
          </DialogTitle>
          <DialogDescription>
            {step === 'pick'
              ? t('inventory.stepProductsHint')
              : t('inventory.receiveDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {result ? (
            <div className="space-y-4">
              <StockOperationSummary
                operation={result.operation}
                replayed={result.replayed}
                productName={productName}
                binLabel={binLabel}
                warehouseLabel={warehouseLabel}
              />
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('inventory.done')}
                </Button>
              </div>
            </div>
          ) : step === 'pick' ? (
            <div className="space-y-4">
              {lockedLocationId !== undefined && (
                <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {t('inventory.lockedBin')}:{' '}
                    <span className="font-medium">
                      {binLabel(Number(lockedLocationId)) ?? String(lockedLocationId)}
                    </span>
                  </span>
                </div>
              )}
              <ProductPickerList
                selectedId={productId}
                onSelect={(id, name, variants) => {
                  setProductId(id);
                  setProductName(name);
                  setProductVariants(variants);
                  setVariantId(null);
                  setVariantError(undefined);
                  // The picker lives OUTSIDE the RHF form — sync the choice
                  // into the form value or validation blocks the submit with
                  // an INVISIBLE "product is required" (root cause found via
                  // the instrumentation round: chip state is NOT form state).
                  form.setValue('productId', String(id), {
                    shouldValidate: true,
                  });
                }}
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  disabled={productId === null}
                  onClick={() => setStep('details')}
                >
                  {t('inventory.continue')}
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitForm();
              }}
              noValidate
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {t('inventory.selectedProduct')}
                  </p>
                  <p className="truncate text-sm font-medium">
                    {productName ?? `#${productId ?? ''}`}
                  </p>
                  {registerError('productId') && (
                    <p className="text-xs text-destructive">
                      {registerError('productId')}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('pick')}
                >
                  <Pencil className="me-1.5 h-3.5 w-3.5" />
                  {t('inventory.change')}
                </Button>
              </div>

              {needsVariant && (
                <div className="space-y-1.5">
                  <Label htmlFor="receive-variant">{t('inventory.selectVariant')}</Label>
                  <Select
                    value={variantId === null ? '' : String(variantId)}
                    onValueChange={(value) => {
                      if (value !== null) {
                        setVariantId(Number(value));
                        setVariantError(undefined);
                      }
                    }}
                  >
                    <SelectTrigger id="receive-variant">
                      <SelectValue placeholder={t('inventory.variantPlaceholder')}>
                        {variantId !== null &&
                          variantLabel(
                            productVariants.find((v) => v.id === variantId)
                          )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {productVariants.map((variant) => (
                        <SelectItem key={variant.id} value={String(variant.id)}>
                          {variantLabel(variant)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {variantError && (
                    <p className="text-xs text-destructive">{variantError}</p>
                  )}
                </div>
              )}

              {lockedLocationId === undefined && (
                <div className="space-y-1.5">
                  <Label htmlFor="receive-location">{t('inventory.location')}</Label>
                  <Select
                    value={form.watch('locationId')}
                    onValueChange={(value) => form.setValue('locationId', value ?? '')}
                  >
                    <SelectTrigger id="receive-location">
                      <SelectValue placeholder={t('inventory.locationPlaceholder')}>
                        {selectedBin
                          ? `${selectedBin.code} — ${selectedBin.name}`
                          : t('inventory.locationPlaceholder')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {selectableBins.map((location: WarehouseLocation) => (
                        <SelectItem key={location.id} value={String(location.id)}>
                          {`${location.code} — ${location.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {registerError('locationId') && (
                    <p className="text-xs text-destructive">
                      {registerError('locationId')}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="receive-quantity">{t('inventory.quantity')}</Label>
                <Input
                  id="receive-quantity"
                  type="number"
                  min={1}
                  placeholder={t('inventory.quantityPlaceholder')}
                  {...form.register('quantity')}
                />
                {registerError('quantity') && (
                  <p className="text-xs text-destructive">{registerError('quantity')}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receive-reference">{t('inventory.reference')}</Label>
                <Input
                  id="receive-reference"
                  placeholder={t('inventory.referencePlaceholder')}
                  {...form.register('reference')}
                />
                {registerError('reference') && (
                  <p className="text-xs text-destructive">{registerError('reference')}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  onClick={(event) => {
                    // Click-invoked submit: keeps the path out of native
                    // form-submit event semantics inside the dialog portal.
                    event.preventDefault();
                    submitForm();
                  }}
                >
                  {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {isPending ? t('inventory.receiving') : t('inventory.receiveBtn')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
