import { ImageIcon } from 'lucide-react';
import { ImagePreview } from '@/shared/components/image-preview';

interface TagImageCellProps {
  src: string;
  alt: string;
}

export function TagImageCell({ src, alt }: TagImageCellProps) {
  if (!src) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <ImagePreview
      src={src}
      alt={alt}
      thumbnailClassName="h-10 w-10 rounded-lg object-cover"
    />
  );
}
