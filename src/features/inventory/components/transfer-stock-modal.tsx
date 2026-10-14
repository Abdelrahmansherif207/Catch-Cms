import { useEffect, useMemo, useState } from 'react';
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
import { ArrowRightLeft, Loader2, Pencil } from 'lucide-react';
import { useLocations } from '@/features/locations/hooks/use-locations';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import type { ApiErrorResponse } from '@/shared/api';
import type { WarehouseLocation } from '@/features/locations/types/location.types';
import { useTransferStock } from '../hooks/use-inventory';
import {
  transferStockFormSchema,
  transferStockFormDefaults,
  emptyToNull,
  type TransferStockFormValues,
} from '../schemas/inventory.schema';
import type {
  StockOperationResultData,
  TransferStockData,
} from '../types/inventory.types';
import { isStockCapableBin } from '../types/inventory.types';
import { ProductPickerList } from './product-picker-list';
import { StockOperationSummary } from './stock-operation-summary';

const SERVER_FIELD_MAP: Record<string, keyof TransferStockFormValues> = {
  product_id: 'productId',
  source_location_id: 'sourceLocationId',
  destination_location_id: 'destinationLocationId',
  quantity: 'quantity',
  reference: 'reference',
};

function generateIdempotencyKey(): string {
  return `ui-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface TransferStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Transfer stock modal (centered), two steps in one dialog:
 * 1. pick ONE receivable product (same picker list as receive)
 * 2. source bin → destination bin (same-warehouse narrowed), quantity,
 *    reference. Total invariance is the backend's job; refusals surface
 *    verbatim.
 */
export function TransferStockModal({
  open,
  onOpenChange,
}: TransferStockModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'pick' | 'details'>('pick');
  const [productId, setProductId] = useState<number | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [result, setResult] = useState<StockOperationResultData | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);

  const form = useForm<TransferStockFormValues>({
    resolver: zodResolver(transferStockFormSchema),
    defaultValues: transferStockFormDefaults as TransferStockFormValues,
  });

  const { data: locationsData } = useLocations({ limit: 100 });
  const { data: warehousesData } = useWarehouses({ limit: 100 });

  const selectableBins = useMemo(
    () =>
      (locationsData?.data ?? []).filter((location: WarehouseLocation) =>
        isStockCapableBin(location)
      ),
    [locationsData]
  );

  // Transfers NEVER cross warehouses (live-verified refusal) — the destination
  // picker narrows to the source's warehouse up front and excludes the source.
  const sourceLocationId = form.watch('sourceLocationId');
  const sourceBin = selectableBins.find(
    (location) => String(location.id) === sourceLocationId
  );
  const destinationBins = useMemo(
    () =>
      sourceBin
        ? selectableBins.filter(
            (location) => location.warehouse_id === sourceBin.warehouse_id
          )
        : [],
    [sourceBin, selectableBins]
  );

  useEffect(() => {
    if (open) {
      setStep('pick');
      setProductId(null);
      setProductName(null);
      setResult(null);
      setIdempotencyKey(generateIdempotencyKey());
      form.reset({ ...transferStockFormDefaults } as TransferStockFormValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mutation = useTransferStock();
  const isPending = mutation.isPending;

  const binLabel = (locationId: number | null | undefined) => {
    if (locationId === null || locationId === undefined) return undefined;
    const bin = selectableBins.find((location) => location.id === locationId);
    return bin ? `${bin.code} — ${bin.name}` : `#${locationId}`;
  };

  const warehouseLabel = (warehouseId: number | null | undefined) => {
    if (warehouseId === null || warehouseId === undefined) return undefined;
    const warehouse = (warehousesData?.data ?? []).find(
      (item) => String(item.id) === String(warehouseId)
    );
    return warehouse?.name ?? `#${warehouseId}`;
  };

  const onSubmit = (values: TransferStockFormValues) => {
    const payload: TransferStockData = {
      product_id: Number(values.productId),
      source_location_id: Number(values.sourceLocationId),
      destination_location_id: Number(values.destinationLocationId),
      quantity: Number(values.quantity),
      reference: emptyToNull(values.reference),
      idempotency_key: idempotencyKey,
    };
    mutation.mutate(payload, {
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

  const registerError = (field: keyof TransferStockFormValues): string | undefined => {
    const message = form.formState.errors[field]?.message as string | undefined;
    return message ? t(message) : undefined;
  };

  // base-ui Select renders the RAW value in the trigger — the selected bins'
  // labels must be supplied as SelectValue children (locations-form pattern).
  const selectedDestination = destinationBins.find(
    (location) => String(location.id) === form.watch('destinationLocationId')
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            {t('inventory.transferTitle')}
          </DialogTitle>
          <DialogDescription>
            {step === 'pick'
              ? t('inventory.stepProductsHint')
              : t('inventory.transferDescription')}
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
              <ProductPickerList
                selectedId={productId}
                onSelect={(id, name) => {
                  setProductId(id);
                  setProductName(name);
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
              onSubmit={form.handleSubmit(onSubmit)}
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

              <div className="space-y-1.5">
                <Label htmlFor="transfer-source">{t('inventory.sourceLocation')}</Label>
                <Select
                  value={sourceLocationId}
                  onValueChange={(value) => {
                    form.setValue('sourceLocationId', value ?? '');
                    if (form.watch('destinationLocationId')) {
                      form.setValue('destinationLocationId', '');
                    }
                  }}
                >
                  <SelectTrigger id="transfer-source">
                    <SelectValue placeholder={t('inventory.locationPlaceholder')}>
                      {sourceBin
                        ? `${sourceBin.code} — ${sourceBin.name}`
                        : t('inventory.locationPlaceholder')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {selectableBins.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {`${location.code} — ${location.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {registerError('sourceLocationId') && (
                  <p className="text-xs text-destructive">
                    {registerError('sourceLocationId')}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transfer-destination">
                  {t('inventory.destinationLocation')}
                </Label>
                <Select
                  value={form.watch('destinationLocationId')}
                  onValueChange={(value) =>
                    form.setValue('destinationLocationId', value ?? '')
                  }
                >
                  <SelectTrigger id="transfer-destination">
                    <SelectValue placeholder={t('inventory.destinationPlaceholder')}>
                      {selectedDestination
                        ? `${selectedDestination.code} — ${selectedDestination.name}`
                        : t('inventory.destinationPlaceholder')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {destinationBins.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {`${location.code} — ${location.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {registerError('destinationLocationId') && (
                  <p className="text-xs text-destructive">
                    {registerError('destinationLocationId')}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transfer-quantity">{t('inventory.quantity')}</Label>
                <Input
                  id="transfer-quantity"
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
                <Label htmlFor="transfer-reference">{t('inventory.reference')}</Label>
                <Input
                  id="transfer-reference"
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
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {isPending ? t('inventory.transferring') : t('inventory.transferBtn')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
