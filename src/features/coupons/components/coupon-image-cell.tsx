import { ImageIcon } from 'lucide-react';
import { ImagePreview } from '@/shared/components/image-preview';
import type { CouponImage } from '../types/coupon.types';

interface CouponImageCellProps {
  image: CouponImage;
  alt: string;
}

export function CouponImageCell({ image, alt }: CouponImageCellProps) {
  const imageUrl = image.desktop || image.mobile;

  if (!imageUrl) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <ImagePreview
      src={imageUrl}
      alt={alt}
      thumbnailClassName="h-10 w-10 rounded-lg object-cover"
    />
  );
}
