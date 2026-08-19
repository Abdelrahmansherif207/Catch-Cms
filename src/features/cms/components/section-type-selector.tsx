import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

import slidersSvg from '@/shared/sectiontypes/sliders.svg';
import promotionsSvg from '@/shared/sectiontypes/promotions.svg';
import flashSalesSvg from '@/shared/sectiontypes/flash-sales.svg';
import couponsSvg from '@/shared/sectiontypes/coupons.svg';
import brandsSvg from '@/shared/sectiontypes/brands.svg';
import categoriesSvg from '@/shared/sectiontypes/categories.svg';
import productsSvg from '@/shared/sectiontypes/products.svg';
import bannersSvg from '@/shared/sectiontypes/banners.svg';

const SVG_MAP: Record<string, string> = {
  sliders: slidersSvg,
  promotions: promotionsSvg,
  'flash-sales': flashSalesSvg,
  coupons: couponsSvg,
  brands: brandsSvg,
  categories: categoriesSvg,
  products: productsSvg,
  banners: bannersSvg,
};

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
  return (
    <div className="grid grid-cols-3 gap-3">
      {types.map((type) => {
        const svg = SVG_MAP[type];
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
              <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Check className="size-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
