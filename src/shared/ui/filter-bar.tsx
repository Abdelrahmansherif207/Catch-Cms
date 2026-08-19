import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Button } from '@/shared/ui/button';

interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile || !children) {
    return <div className="flex flex-wrap items-center gap-3">{children}</div>;
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="w-full justify-between">
        <span className="flex items-center gap-2">
          <span>{t('common.filters')}</span>
          <span className="text-xs text-muted-foreground">({t('common.show')})</span>
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {open && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-card">
          {children}
        </div>
      )}
    </div>
  );
}
