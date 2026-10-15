import { Checkbox } from '@/shared/ui/checkbox';
import { cn } from '@/shared/lib/utils';

interface SelectCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Accessible name — usually the row's display label. */
  ariaLabel: string;
  className?: string;
}

/**
 * Selection checkbox with a RELIABLE hit target: the 16px icon box alone is a
 * too-small span (adjacent cell padding swallows clicks), so a padded,
 * focusable button wraps it and forwards the click — the whole 32px round
 * area checks. The visual stays the shared Checkbox (primary tone, red only
 * via aria-invalid the box itself never enters in selection flows).
 */
export function SelectCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  onCheckedChange,
  ariaLabel,
  className,
}: SelectCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors',
        disabled
          ? 'cursor-not-allowed'
          : 'cursor-pointer hover:bg-muted active:bg-muted/70',
        className
      )}
      onClick={() => {
        if (!disabled) onCheckedChange?.(!checked);
      }}
    >
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none"
      />
    </button>
  );
}
