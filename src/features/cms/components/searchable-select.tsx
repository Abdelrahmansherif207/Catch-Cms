import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';
import { useEntitySearchInfinite } from '../hooks/use-sections';

interface SearchableSelectProps {
  endpoint: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

function getItemLabel(item: any): string {
  let nameStr = '';
  if (typeof item.name === 'string') {
    try {
      const parsed = JSON.parse(item.name);
      nameStr = parsed.en || parsed.ar || item.name;
    } catch {
      nameStr = item.name;
    }
  } else if (item.name?.en) {
    nameStr = item.name.en;
  } else if (item.title) {
    if (typeof item.title === 'string') {
      try {
        const parsed = JSON.parse(item.title);
        nameStr = parsed.en || parsed.ar || item.title;
      } catch {
        nameStr = item.title;
      }
    } else if (item.title?.en) {
      nameStr = item.title.en;
    }
  } else if (item.slug) {
    nameStr = item.slug;
  } else {
    nameStr = `Item #${item.id}`;
  }
  return nameStr;
}

export function SearchableSelect({
  endpoint,
  value,
  onChange,
  placeholder,
}: SearchableSelectProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{
    bottom: number;
    left: number;
    width: number;
  } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useEntitySearchInfinite(endpoint, debouncedTerm);

  const items = (data?.pages ?? []).flatMap((page: any) => {
    const list = page?.data?.data || page?.data || [];
    return Array.isArray(list) ? list : [];
  });

  const selectedItem = value
    ? items.find((item: any) => item.slug === value)
    : undefined;
  const selectedLabel = selectedItem ? getItemLabel(selectedItem) : value || '';

  const close = useCallback(() => {
    setIsOpen(false);
    setDropdownStyle(null);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideWrapper =
        wrapperRef.current && !wrapperRef.current.contains(target);
      const isOutsidePortal =
        portalRef.current && !portalRef.current.contains(target);
      if (isOutsideWrapper && isOutsidePortal) {
        close();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: Event) => {
      if (portalRef.current?.contains(e.target as Node)) return;
      close();
    };
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
    };
  }, [isOpen, close]);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsOpen(true);
  };

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const selectItem = (item: any) => {
    onChange(item.slug ?? String(item.id));
    setIsOpen(false);
    setDropdownStyle(null);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        className="flex min-h-[32px] w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-sm"
        onClick={() => (isOpen ? close() : openDropdown())}
      >
        <span
          className={cn(
            'truncate',
            selectedLabel ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {selectedLabel || placeholder || t('common.search')}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selectedLabel && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </span>
      </button>

      {isOpen &&
        dropdownStyle &&
        createPortal(
          <div
            ref={portalRef}
            className="fixed z-[9999] rounded-md border bg-popover p-1 shadow-md"
            style={{
              bottom: dropdownStyle.bottom,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
            }}
          >
            <div className="relative mb-1">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 ps-7 text-xs"
                autoFocus
              />
            </div>
            <div
              ref={listRef}
              onScroll={handleScroll}
              className="max-h-[200px] overflow-auto"
            >
              {isLoading && items.length === 0 && (
                <p className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('common.loading')}
                </p>
              )}
              {!isLoading && items.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  {searchTerm ? t('common.noData') : t('common.search')}
                </p>
              )}
              {items.map((item: any) => {
                const isSelected = value === item.slug;
                return (
                  <div
                    key={item.id}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                    onClick={() => selectItem(item)}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-sm border shrink-0',
                        isSelected ? 'bg-primary border-primary' : 'border-input'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm truncate">{getItemLabel(item)}</span>
                  </div>
                );
              })}
              {isFetchingNextPage && (
                <p className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('common.loading')}
                </p>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
