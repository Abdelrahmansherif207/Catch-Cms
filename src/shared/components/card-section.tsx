import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface CardSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Titled content section for detail/form pages: consistent header row
 * (icon tile + title + description + action) over a card body.
 */
export function CardSection({ title, description, icon: Icon, action, children, className, contentClassName }: CardSectionProps) {
  return (
    <section className={cn('rounded-2xl border bg-card p-5 shadow-card sm:p-6', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
