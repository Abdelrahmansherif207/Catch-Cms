import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  PRODUCT_TEMPLATE_GROUPS,
  type ProductTemplateGroupId,
  type ProductTemplateInfo,
} from '../lib/product-templates';

interface ProductsTemplatePickerProps {
  options: ProductTemplateInfo[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Grouped, picker-only template selector for Preset mode. Shows the human
 * label with the one-line description under each option; options are grouped
 * (Performance, Discounts, Flash Sales, Catalog, Other). Keys come live from
 * /product-type — free text is never offered, and the saved key is preserved.
 */
export function ProductsTemplatePicker({
  options,
  value,
  onChange,
  placeholder,
}: ProductsTemplatePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const selected = options.find((option) => option.value === value) ?? null;
  const selectedLabel = selected
    ? selected.labelKey
      ? t(selected.labelKey)
      : selected.fallbackLabel ?? selected.value
    : null;
  const selectedDescription =
    selected?.descriptionKey != null ? t(selected.descriptionKey) : null;

  const close = useCallback(() => {
    setIsOpen(false);
    setDropdownStyle(null);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const outsideWrapper = wrapperRef.current && !wrapperRef.current.contains(target);
      const outsidePortal = portalRef.current && !portalRef.current.contains(target);
      if (outsideWrapper && outsidePortal) close();
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
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
      window.removeEventListener('scroll', handle);
      window.removeEventListener('resize', handle);
    };
  }, [isOpen, close]);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsOpen(true);
  };

  const groups = PRODUCT_TEMPLATE_GROUPS.map((group) => ({
    ...group,
    options: options.filter((option) => option.group === (group.id as ProductTemplateGroupId)),
  })).filter((group) => group.options.length > 0);

  return (
    <div ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-start text-sm shadow-sm"
        onClick={() => (isOpen ? close() : openDropdown())}
        aria-expanded={isOpen}
      >
        <span className="min-w-0">
          {selected ? (
            <>
              <span className="block truncate font-medium">{selectedLabel}</span>
              {selectedDescription && (
                <span className="block truncate text-xs text-muted-foreground">
                  {selectedDescription}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">
              {placeholder ?? t('sections.selectProductTemplate')}
            </span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {isOpen &&
        dropdownStyle &&
        createPortal(
          <div
            ref={portalRef}
            className="fixed z-[9999] max-h-[320px] overflow-auto rounded-md border bg-popover p-1 shadow-md"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
            }}
          >
            {groups.map((group) => (
              <div key={group.id} className="py-1">
                <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(group.labelKey)}
                </p>
                {group.options.map((option) => {
                  const isSelected = option.value === value;
                  const label = option.labelKey
                    ? t(option.labelKey)
                    : option.fallbackLabel ?? option.value;
                  return (
                    <div
                      key={option.value}
                      className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                      onClick={() => {
                        onChange(option.value);
                        close();
                      }}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                          isSelected ? 'border-primary bg-primary' : 'border-input'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{label}</span>
                        {option.descriptionKey && (
                          <span className="block text-xs text-muted-foreground">
                            {t(option.descriptionKey)}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
