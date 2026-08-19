import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

interface CategoryLevelBadgeProps {
  level: number;
}

const levelVariants: Record<number, { label: string; className: string }> = {
  1: { label: 'Root', className: 'bg-primary/10 text-primary' },
  2: { label: 'Sub', className: 'bg-secondary/10 text-secondary-foreground' },
  3: { label: 'Sub-sub', className: 'bg-muted text-muted-foreground' },
};

export function CategoryLevelBadge({ level }: CategoryLevelBadgeProps) {
  const variant = levelVariants[level] || {
    label: `Level ${level}`,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-normal', variant.className)}
    >
      {variant.label}
    </Badge>
  );
}
