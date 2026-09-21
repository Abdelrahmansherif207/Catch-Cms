import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  /** Header action slot (e.g. ChartSwitcher, time-range tabs, "view all" link). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Consistent dashboard section shell: titled card with description,
 * optional header action, and padded content area.
 */
export function ChartCard({ title, description, action, children, className, contentClassName }: ChartCardProps) {
  return (
    <section className={cn('rounded-2xl border bg-card p-5 shadow-card sm:p-6', className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

interface ChartCardErrorProps {
  title: string;
  message?: string;
  className?: string;
}

/** Matching error shell so failed sections keep the grid rhythm. */
export function ChartCardError({ title, message, className }: ChartCardErrorProps) {
  const { t } = useTranslation();
  return (
    <ChartCard title={title} className={className}>
      <div className="rounded-xl bg-destructive-soft p-4 text-sm text-destructive">
        {message ?? t('dashboard.errors.failedToLoad')}
      </div>
    </ChartCard>
  );
}
