import { useTranslation } from 'react-i18next';
import { Route } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/shared/ui/select';

export interface PickBatchOption {
  id: number;
  label: string;
}

interface PickRouteSelectorProps {
  batchId: number | null;
  batches: PickBatchOption[];
  loading: boolean;
  onSelect: (batchId: number | null) => void;
}

/** Batch picker for the pick-route focus mode. */
export function PickRouteSelector({ batchId, batches, loading, onSelect }: PickRouteSelectorProps) {
  const { t } = useTranslation();

  const current = batchId !== null ? batches.find((b) => b.id === batchId) : undefined;
  const empty = !loading && batches.length === 0;

  return (
    <Select
      value={batchId !== null ? String(batchId) : 'none'}
      onValueChange={(value) => onSelect(value && value !== 'none' ? Number(value) : null)}
      disabled={empty}
    >
      <SelectTrigger
        aria-label={t('warehouseMap.pickRoute')}
        disabled={empty}
        className="h-8 w-[190px] gap-1.5"
      >
        <Route className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="shrink-0 font-normal text-muted-foreground">
            {t('warehouseMap.pickRoute')}:
          </span>
          <span className="truncate font-semibold text-foreground">
            {current?.label ?? (empty ? t('warehouseMap.noBatches') : t('warehouseMap.routeNone'))}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t('warehouseMap.routeNone')}</SelectItem>
        {batches.map((batch) => (
          <SelectItem key={batch.id} value={String(batch.id)}>
            {batch.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
