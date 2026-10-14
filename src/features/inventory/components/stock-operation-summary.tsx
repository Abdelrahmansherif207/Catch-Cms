import { ArrowRight, CheckCircle2, Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import type { StockOperation } from '../types/inventory.types';

interface StockOperationSummaryProps {
  operation: StockOperation;
  replayed: boolean;
  productName?: string | null;
  binLabel: (locationId: number | null | undefined) => string | undefined;
  warehouseLabel: (warehouseId: number | null | undefined) => string | undefined;
}

function FactRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/**
 * Success block shared by both dialogs: render the live-verified operation
 * resource — the touched bins, the new product authority level, the moved /
 * received quantity, the audit reference and the replay marker. Bins and
 * warehouse names resolve through the dialog-side label functions (both
 * dialogs already hold their location/warehouse lists).
 */
export function StockOperationSummary({
  operation,
  replayed,
  productName,
  binLabel,
  warehouseLabel,
}: StockOperationSummaryProps) {
  const { t } = useTranslation();
  const isReceipt = operation.received_quantity !== null;
  const movedQuantity = isReceipt
    ? operation.received_quantity
    : operation.transferred_quantity;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        <p className="font-medium">
          {isReceipt
            ? t('inventory.received')
            : t('inventory.transferred')}
        </p>
        {replayed && (
          <Badge variant="outline" className="gap-1 font-normal">
            <Repeat className="h-3 w-3" />
            {t('inventory.replayedBadge')}
          </Badge>
        )}
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
        <FactRow
          label={t('inventory.product')}
          value={productName ?? `#${operation.product_id}`}
        />
        <FactRow
          label={t('inventory.warehouse')}
          value={
            warehouseLabel(operation.warehouse_id) ?? String(operation.warehouse_id)
          }
        />
        {isReceipt ? (
          <FactRow
            label={t('inventory.bins.receivedInto')}
            value={
              binLabel(operation.placement?.location_id) ??
              String(operation.placement?.location_id ?? '')
            }
          />
        ) : (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              {t('inventory.bins.movedFromTo')}
            </span>
            <span className="flex items-center gap-1 text-right font-medium">
              {binLabel(operation.source_placement?.location_id) ??
                String(operation.source_placement?.location_id ?? '')}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              {binLabel(operation.destination_placement?.location_id) ??
                String(operation.destination_placement?.location_id ?? '')}
            </span>
          </div>
        )}
        <FactRow
          label={isReceipt ? t('inventory.unitsReceived') : t('inventory.unitsMoved')}
          value={movedQuantity ?? 0}
        />
        <FactRow label={t('inventory.stockLevelNow')} value={operation.stock_quantity} />
        {operation.reference && (
          <FactRow label={t('inventory.referenceLabel')} value={operation.reference} />
        )}
      </div>
    </div>
  );
}
