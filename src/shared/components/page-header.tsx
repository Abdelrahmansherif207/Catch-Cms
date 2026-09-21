import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { buttonVariants } from '@/shared/ui/button';

export interface PageCrumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  crumbs?: PageCrumb[];
  actions?: ReactNode;
  /** Optional meta row (counts, timestamps) rendered under the description. */
  meta?: ReactNode;
  className?: string;
}

/**
 * Standard page header: breadcrumbs (optional) + title + description + actions.
 * Actions wrap on small screens instead of squeezing/overflowing.
 */
export function PageHeader({ title, description, crumbs, actions, meta, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-3', className)}>
      <div className="min-w-0 space-y-1">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-1.5">
            <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
              {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                    {i > 0 && (
                      <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                    )}
                    {isLast || !crumb.to ? (
                      <span aria-current="page" className="font-medium text-foreground">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link to={crumb.to} className="transition-colors hover:text-foreground">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-balance text-foreground sm:text-[1.75rem] sm:leading-9">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-[0.9375rem] text-muted-foreground">{description}</p>
        )}
        {meta && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-sm text-muted-foreground">
            {meta}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">{actions}</div>
      )}
    </div>
  );
}

interface PageBackHeaderProps {
  title: string;
  description?: string;
  backTo: string;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Detail/form page header: back button + title + actions.
 * Title truncates so long identifiers (e.g. order numbers) can't break layout.
 */
export function PageBackHeader({
  title,
  description,
  backTo,
  backLabel,
  actions,
  className,
}: PageBackHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-3', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        <Link
          to={backTo}
          aria-label={backLabel ?? t('common.back')}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'shrink-0 rounded-full shadow-xs')}
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
        <div className="min-w-0 space-y-0.5">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem] sm:leading-9">
            {title}
          </h1>
          {description && (
            <p className="truncate text-[0.9375rem] text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}
