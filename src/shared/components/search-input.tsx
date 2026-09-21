import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Standard search field: logical (RTL-safe) icon position, clear button.
 * Replaces the hand-rolled search inputs copy-pasted across list pages.
 */
export function SearchInput({ value, onChange, placeholder, className, autoFocus }: SearchInputProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('relative w-full sm:max-w-sm', className)}>
      <Search
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('common.search')}
        aria-label={placeholder ?? t('common.search')}
        className="pe-9 ps-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onChange('')}
          aria-label={t('common.clear')}
          className="absolute end-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
