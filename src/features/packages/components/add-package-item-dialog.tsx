import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackagePlus } from 'lucide-react';
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
import { usePackage, useAddPackageItem } from '@/features/packages/hooks/use-packages';
import {
  addPackageItemSchema,
  type AddPackageItemFormValues,
} from '@/features/packages/schemas/package.schema';
import type { FulfillmentItem } from '@/features/fulfillments/types/fulfillment.types';

interface AddPackageItemDialogProps {
  packageId: number;
  /** The fulfillment's item rows (picked quantities live here). */
  items: FulfillmentItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Picked-quantity picker for one OPEN package. Remaining per item =
 * picked − Σ non-voided package_items (the one-active rule means the open
 * package is the only live contributor; voided items count back in, which
 * matches the verify math server-side).
 */
export function AddPackageItemDialog({
  packageId,
  items,
  open,
  onOpenChange,
}: AddPackageItemDialogProps) {
  const { t } = useTranslation();
  const { data: detailResponse } = usePackage(packageId);
  const addMutation = useAddPackageItem();

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Gated render — remounts fresh per open (no reset effect).
  if (!open) return null;

  const packedPerCache = new Map<number, number>();
  for (const entry of detailResponse?.data.items ?? []) {
    packedPerCache.set(
      entry.fulfillment_item_id,
      (packedPerCache.get(entry.fulfillment_item_id) ?? 0) + Number(entry.quantity || 0)
    );
  }

  const rows = items.map((item) => {
    const picked = Number(item.quantity_picked) || 0;
    const packed = packedPerCache.get(item.id) ?? 0;
    return { item, picked, packed, remaining: Math.max(picked - packed, 0) };
  });
  const addable = rows.filter((row) => row.remaining > 0);

  const selectedRow = addable.find((row) => String(row.item.id) === selectedItemId);

  const handleAdd = () => {
    if (!selectedRow) {
      setError(t('packages.selectItemRequired'));
      return;
    }

    const parsed = addPackageItemSchema.safeParse({
      fulfillment_item_id: selectedRow.item.id,
      quantity: Number(quantity),
    } satisfies Partial<AddPackageItemFormValues>);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('packages.quantityRequired'));
      return;
    }
    if (parsed.data.quantity > selectedRow.remaining) {
      setError(t('packages.atMostRemaining', { remaining: selectedRow.remaining }));
      return;
    }

    setError(null);
    addMutation.mutate(
      { id: packageId, payload: parsed.data },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            {t('packages.addItemTitle', { id: packageId })}
          </DialogTitle>
          <DialogDescription>{t('packages.addItemDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {addable.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('packages.noRemaining')}</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>{t('packages.selectItem')}</Label>
                <Select
                  value={selectedItemId}
                  onValueChange={(value) => {
                    if (value === null) return;
                    setSelectedItemId(value);
                    const row = addable.find((candidate) => String(candidate.item.id) === value);
                    if (row) setQuantity(String(row.remaining));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('packages.selectItemPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {addable.map((row) => (
                      <SelectItem key={row.item.id} value={String(row.item.id)}>
                        {t('packages.itemOption', {
                          id: row.item.id,
                          product: row.item.product_id,
                          remaining: row.remaining,
                          picked: row.picked,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRow && (
                  <p className="text-xs text-muted-foreground">
                    {t('packages.pickerLine', {
                      picked: selectedRow.picked,
                      packed: selectedRow.packed,
                      remaining: selectedRow.remaining,
                    })}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="package-item-qty">{t('packages.quantity')}</Label>
                <Input
                  id="package-item-qty"
                  type="number"
                  min={1}
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </div>

              {error && <p className="text-xs text-destructive">{t(error)}</p>}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={addMutation.isPending || addable.length === 0 || !selectedItemId}
          >
            {addMutation.isPending ? t('packages.adding') : t('packages.addItem')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
