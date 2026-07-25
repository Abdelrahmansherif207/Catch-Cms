import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface ImagePreviewProps {
  src: string;
  alt: string;
  thumbnailClassName?: string;
}

export function ImagePreview({ src, alt, thumbnailClassName = '' }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-pointer hover:opacity-80 transition-opacity ${thumbnailClassName}`}
        onClick={() => setIsOpen(true)}
      />

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Button
              variant="secondary"
              size="icon"
              className="absolute -right-2 -top-2 z-10 rounded-full shadow-lg"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={src}
              alt={alt}
              className="max-h-[85vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
