import { Check, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { sectionTypeImage } from '../lib/section-type-images';

function formatTypeName(type: string): string {
  return type
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface SectionTypeSelectorProps {
  types: string[];
  value: string;
  onChange: (type: string) => void;
  disabled?: boolean;
}

export function SectionTypeSelector({
  types,
  value,
  onChange,
  disabled,
}: SectionTypeSelectorProps) {
  const { t } = useTranslation();

  // Edit mode: the section type is immutable (the update API ignores `type`),
  // so the full picker grid would just be a wall of unclickable cards — show
  // only the current type as a read-only card instead.
  if (disabled) {
    const svg = sectionTypeImage(value);

    return (
      <div className="flex">
        <div
          className="relative flex w-40 flex-col items-center gap-2 rounded-lg border border-primary bg-primary/[0.03] p-3 text-center ring-2 ring-primary/20"
          aria-label={formatTypeName(value)}
        >
          {svg && (
            <img
              src={svg}
              alt={formatTypeName(value)}
              className="w-full rounded-md"
            />
          )}
          <span className="text-xs font-semibold leading-tight text-primary">
            {formatTypeName(value)}
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="absolute end-2 top-2 flex size-5 cursor-help items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Lock className="size-3" />
                </span>
              }
            />
            <TooltipContent>{t('sections.typeLocked')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {types.map((type) => {
        const svg = sectionTypeImage(type);
        const isSelected = value === type;

        return (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(type)}
            className={cn(
              'group relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all',
              isSelected
                ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.03]'
                : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30',
              disabled && 'cursor-not-allowed opacity-60',
              !disabled && 'cursor-pointer'
            )}
          >
            {svg && (
              <img
                src={svg}
                alt={formatTypeName(type)}
                className="w-full rounded-md"
              />
            )}
            <span
              className={cn(
                'text-xs font-medium leading-tight',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {formatTypeName(type)}
            </span>
            {isSelected && (
              <span className="absolute end-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Check className="size-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
