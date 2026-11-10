import { useTranslation } from 'react-i18next';
import { Film, ImageIcon } from 'lucide-react';
import type { Hero } from '../types/hero.types';

interface HeroMediaCellProps {
  hero: Hero;
}

export function HeroMediaCell({ hero }: HeroMediaCellProps) {
  const { t } = useTranslation();
  const isVideo = hero.type === 'video';
  const videoUrl = hero.media?.url || null;
  const thumbUrl = hero.media?.thumb_url || null;
  // `thumb_url` is an image; it may be the poster or the cell image but must
  // never be the `<video>` source.
  const url = thumbUrl || videoUrl;

  if (!url || (isVideo && !videoUrl)) {
    return (
      <div className="flex h-14 w-24 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {isVideo ? <Film className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
      </div>
    );
  }

  return isVideo ? (
    <video
      src={videoUrl ?? undefined}
      poster={thumbUrl ?? undefined}
      muted
      playsInline
      preload="metadata"
      className="h-14 w-24 rounded-lg bg-black/90 object-cover"
      aria-label={t('heroes.media')}
    />
  ) : (
    <img src={url} alt={t('heroes.media')} className="h-14 w-24 rounded-lg object-cover" />
  );
}
