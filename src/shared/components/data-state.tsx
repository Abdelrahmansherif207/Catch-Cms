import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

interface DataEmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  /** Show a "clear filters" button when the empty result is caused by active filters. */
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

/**
 * Standard empty state for tables and lists — replaces bare "no data" rows.
 */
export function DataEmptyState({
  title,
  description,
  action,
  hasActiveFilters,
  onClearFilters,
  className,
}: DataEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-xs sm:py-14',
        className
      )}
    >
      <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Inbox className="h-7 w-7 text-muted-foreground" aria-hidden strokeWidth={1.5} />
      </span>
      <p className="text-base font-semibold text-foreground">{title ?? t('common.noData')}</p>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {hasActiveFilters && onClearFilters ? (
        <Button variant="outline" size="sm" onClick={onClearFilters} className="mt-2">
          {t('common.clearFilters')}
        </Button>
      ) : (
        action && <div className="mt-2">{action}</div>
      )}
    </div>
  );
}

interface DataErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Standard inline error state with retry — failures must never look like "no data".
 */
export function DataErrorState({ message, onRetry, className }: DataErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive-soft px-6 py-10 text-center shadow-xs',
        className
      )}
    >
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-xs">
        <AlertCircle className="h-6 w-6 text-destructive" aria-hidden strokeWidth={1.75} />
      </span>
      <p className="text-base font-semibold text-foreground">{t('common.loadErrorTitle', { defaultValue: 'Something went wrong' })}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message ?? t('common.loadError')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 bg-card">
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
