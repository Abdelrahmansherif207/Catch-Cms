import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };

export function StarRating({ rating, interactive, onChange, size = 'md' }: StarRatingProps) {
  const stars = Array.from({ length: 5 });

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((_, i) => {
        const filled = i < rating;
        if (interactive && onChange) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
              className={`${sizeMap[size]} transition-colors ${
                filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-400/50'
              }`}
            >
              <Star className={`${sizeMap[size]} ${filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
            </button>
          );
        }
        return (
          <Star
            key={i}
            className={`${sizeMap[size]} ${
              filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
            }`}
          />
        );
      })}
      <span className="ml-1.5 text-sm text-muted-foreground">({rating}/5)</span>
    </div>
  );
}
