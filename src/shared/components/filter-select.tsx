import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/shared/ui/select';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Options excluding the "all" entry. */
  options: FilterOption[];
  /** Contextual prefix shown before the value, e.g. "Status". */
  prefix: string;
  /** Contextual "all" label, e.g. "All Statuses". Never a bare "All". */
  allLabel: string;
  allValue?: string;
  icon?: LucideIcon;
  className?: string;
  triggerClassName?: string;
}

/**
 * Semantic filter dropdown: the trigger always communicates what the
 * control filters — "Status: All" → "Status: Pending" — instead of a
 * bare, ambiguous "All".
 */
export function FilterSelect({
  value,
  onValueChange,
  options,
  prefix,
  allLabel,
  allValue = 'all',
  icon: Icon,
  className,
  triggerClassName,
}: FilterSelectProps) {
  const current =
    value === allValue
      ? allLabel
      : (options.find((o) => o.value === value)?.label ?? allLabel);

  return (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? allValue)}>
      <SelectTrigger
        aria-label={`${prefix}: ${current}`}
        className={cn('gap-2', triggerClassName)}
      >
        <span className={cn('flex min-w-0 flex-1 items-center gap-1.5', className)}>
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
          <span className="shrink-0 font-normal text-muted-foreground">{prefix}:</span>
          <span className="truncate font-semibold text-foreground">{current}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={allValue}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
