import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanBarcode } from 'lucide-react';
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
import { useConfirmPick } from '../hooks/use-picking-tasks';
import { confirmPickSchema, taskProgress } from '../schemas/picking-task.schema';
import type { PickingTaskDetail } from '../types/picking-task.types';

interface ConfirmPickDialogProps {
  task: PickingTaskDetail;
  /** Allocates the next op_seq at submit time (replay protection). */
  onOpSeq: () => number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Scan-shaped confirm: WHERE (location barcode/code) + WHAT (product id,
 * SKU, or barcode) + HOW MUCH. All business validation lives server-side —
 * wrong scans 422 with machine-stable texts surfaced verbatim.
 */
export function ConfirmPickDialog({
  task,
  onOpSeq,
  open,
  onOpenChange,
}: ConfirmPickDialogProps) {
  const { t } = useTranslation();
  const confirmMutation = useConfirmPick();
  const progress = taskProgress(task);

  const [location, setLocation] = useState(task.location?.barcode ?? task.location?.code ?? '');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(String(progress.remaining || 1));
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = () => {
    const parsed = confirmPickSchema.safeParse({
      location: location.trim(),
      product: product.trim(),
      quantity: Number(quantity),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('pickingTasks.confirmInvalid'));
      return;
    }
    setError(null);
    confirmMutation.mutate(
      { id: task.id, payload: { ...parsed.data, op_seq: onOpSeq() } },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setError(null);
        }}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" />
            {t('pickingTasks.confirmTitle', { id: task.id })}
          </DialogTitle>
          <DialogDescription>
            {t('pickingTasks.confirmDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {field(
            'confirm-location',
            t('pickingTasks.confirmLocation'),
            location,
            setLocation,
            t('pickingTasks.confirmLocationPlaceholder')
          )}
          {field(
            'confirm-product',
            t('pickingTasks.confirmProduct'),
            product,
            setProduct,
            t('pickingTasks.confirmProductPlaceholder')
          )}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-quantity">{t('pickingTasks.pickQty')}</Label>
            <Input
              id="confirm-quantity"
              type="number"
              min={0.01}
              step="any"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setError(null);
              }}
            />
          </div>
          {error && <p className="text-xs text-destructive">{t(error)}</p>}
          <p className="text-xs text-muted-foreground">
            {t('pickingTasks.confirmHint', { remaining: progress.remaining })}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirmMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={confirmMutation.isPending}
          >
            {confirmMutation.isPending
              ? t('pickingTasks.confirming')
              : t('pickingTasks.confirmAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
