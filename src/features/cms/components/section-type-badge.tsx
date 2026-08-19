import { Badge } from '@/shared/ui/badge';

const TYPE_STYLES: Record<string, { label: string; variant: string }> = {
  banners: { label: 'Banners', variant: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  sliders: { label: 'Sliders', variant: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400' },
  promotions: { label: 'Promotions', variant: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  categories: { label: 'Categories', variant: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  products: { label: 'Products', variant: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' },
  'flash-sales': { label: 'Flash Sales', variant: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  brands: { label: 'Brands', variant: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
  coupons: { label: 'Coupons', variant: 'bg-pink-500/15 text-pink-700 dark:text-pink-400' },
};

interface SectionTypeBadgeProps {
  type: string;
}

export function SectionTypeBadge({ type }: SectionTypeBadgeProps) {
  const style = TYPE_STYLES[type] || {
    label: type,
    variant: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge
      variant="outline"
      className={`border-0 font-medium text-xs ${style.variant}`}
    >
      {style.label}
    </Badge>
  );
}
