import { useState, type ReactNode } from 'react';
import { ChevronDown, ListFilter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';

interface FilterBarProps {
  children: ReactNode;
  /** Number of active filters — shown as a count badge on mobile. */
  activeCount?: number;
  className?: string;
}

/**
 * List-page filter toolbar: a bordered card on desktop, a collapsible
 * panel with active-count badge on mobile.
 */
export function FilterBar({ children, activeCount = 0, className }: FilterBarProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile || !children) {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-3 gap-y-3 rounded-xl border bg-card p-3 shadow-xs sm:p-4',
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card shadow-xs', className)}>
      <Button
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="h-12 w-full justify-between rounded-none px-4 font-medium"
      >
        <span className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-muted-foreground" aria-hidden />
          {t('common.filters')}
          {activeCount > 0 && (
            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-2xs tabular-nums">
              {activeCount}
            </Badge>
          )}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </Button>
      {open && (
        <div className="flex flex-col gap-3 border-t bg-muted/40 p-4">
          {children}
        </div>
      )}
    </div>
  );
}
