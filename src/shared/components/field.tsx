import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Standard form field: label + control + error text.
 * Injects aria-invalid into the child control so Input's
 * built-in aria-invalid red styling actually triggers from forms.
 */
export function Field({ label, error, required, hint, children, className }: FieldProps) {
  const control =
    isValidElement(children) && error
      ? cloneElement(children as ReactElement<{ 'aria-invalid'?: boolean }>, {
          'aria-invalid': true,
        })
      : children;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ms-1 text-destructive" aria-hidden>
            *
          </span>
        )}
      </label>
      {control}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
