import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

export interface SelectionChip {
  id: number;
  label: string;
}

interface BulkSelectionBarProps {
  /** Selected-row count. */
  count: number;
  /** Hard cap (server rule) — the amber warning fires as count >= cap. */
  cap: number;
  /** Rows for the excludable chip cloud (fulfillment/shipment numbers). */
  chips?: SelectionChip[];
  onRemoveChip?: (id: number) => void;
  onClear: () => void;
  /** Mode/heading label rendered before the count (e.g. "Start packing"). */
  heading?: ReactNode;
  /** Primary bulk actions area (buttons live here). */
  children?: ReactNode;
  className?: string;
}

/**
 * Shared multi-select bar (the orders-table basket styling, extracted):
 * count + heading on the left, actions on the right, an amber (NEVER red)
 * cap warning, and a scrollable chip cloud where every selected row can be
 * EXCLUDED individually (×). One visual for every bulk flow.
 */
export function BulkSelectionBar({
  count,
  cap,
  chips,
  onRemoveChip,
  onClear,
  heading,
  children,
  className,
}: BulkSelectionBarProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card px-4 py-3 shadow-card',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {heading && (
            <span className="me-1.5 font-medium text-foreground">{heading}</span>
          )}
          {t('common.selectedCount', { count })}
          {count >= cap && (
            <span className="ms-1 text-xs text-warning">
              {t('common.selectedCap', { max: cap })}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {children}
          {count > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="me-1 h-3.5 w-3.5" />
              {t('common.clear')}
            </Button>
          )}
        </div>
      </div>

      {chips && chips.length > 0 && onRemoveChip !== undefined && (
        <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto border-t pt-2">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono text-foreground"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => onRemoveChip(chip.id)}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t('common.removeChip', { label: chip.label })}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
