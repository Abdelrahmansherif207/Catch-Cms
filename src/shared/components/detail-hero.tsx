import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface HeroFact {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
}

interface DetailHeroProps {
  /** Title (entity name / number). */
  title: ReactNode;
  /** Subtitle row (date, email, slug…). */
  subtitle?: ReactNode;
  /** Status badges row. */
  badges?: ReactNode;
  /** Leading visual: custom avatar element. */
  avatar?: ReactNode;
  /** …or an icon rendered in a tinted tile. */
  icon?: LucideIcon;
  iconToneClass?: string;
  /** Key facts grid rendered under a divider. */
  facts?: HeroFact[];
  /** Header actions (edit, delete…). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Entity hero card for detail pages: visual + title + badges + key facts.
 * Gives every detail page the same premium entry point.
 */
export function DetailHero({
  title,
  subtitle,
  badges,
  avatar,
  icon: Icon,
  iconToneClass = 'bg-primary/10 text-primary',
  facts,
  actions,
  className,
}: DetailHeroProps) {
  return (
    <section className={cn('rounded-2xl border bg-card p-5 shadow-card sm:p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {avatar ?? (Icon && (
            <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', iconToneClass)}>
              <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
            </span>
          ))}
          <div className="min-w-0 space-y-1.5">
            <h2 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h2>
            {subtitle && (
              <div className="text-sm text-muted-foreground">{subtitle}</div>
            )}
            {badges && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">{badges}</div>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {facts && facts.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-5 sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="flex items-center gap-1.5 text-2xs font-semibold tracking-wider text-muted-foreground uppercase">
                {fact.icon && <fact.icon className="h-3.5 w-3.5" aria-hidden />}
                {fact.label}
              </dt>
              <dd className="mt-1 truncate text-[0.9375rem] font-semibold text-foreground">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
