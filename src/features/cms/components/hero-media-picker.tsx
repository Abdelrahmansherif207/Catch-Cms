import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Check,
  Film,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';
import { useHeroes, heroDescriptionOf } from '@/features/heroes/hooks/use-heroes';
import type { Hero } from '@/features/heroes/types/hero.types';
import {
  findLinkedHero,
  heroMediaPatch,
} from '../lib/section-settings';

interface HeroMediaPickerProps {
  /** Current `setting.front` values of the hero section. */
  values: Record<string, unknown>;
  /** Applies a multi-key patch (media_type + paths) to the front settings. */
  onApply: (patch: Record<string, unknown>) => void;
}

function heroLabel(hero: Hero): string {
  const description = heroDescriptionOf(hero);
  return description.en || description.ar || `Hero #${hero.id}`;
}

/**
 * Links a Hero library record to the hero section's media paths. The section
 * stores plain strings, so picking a hero simply fills those keys — the
 * storefront reads exactly what it reads today.
 */
export function HeroMediaPicker({ values, onApply }: HeroMediaPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch the whole library (not just active records) so an already-linked
  // inactive hero can still be detected and displayed as linked.
  const { data, isLoading, isError, isFetching, refetch } = useHeroes({
    page: 1,
    perPage: 50,
  });

  const heroes = useMemo(() => data?.data?.data ?? [], [data]);

  const linkedHero = useMemo(
    () => findLinkedHero(heroes, values),
    [heroes, values]
  );

  const visibleHeroes = useMemo(() => {
    const sorted = [...heroes].sort(
      (a, b) => Number(b.is_active) - Number(a.is_active)
    );
    const term = search.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter((hero) => {
      const description = heroDescriptionOf(hero);
      return (
        heroLabel(hero).toLowerCase().includes(term) ||
        String(hero.id) === term ||
        hero.type.toLowerCase().includes(term) ||
        (description.ar ?? '').toLowerCase().includes(term)
      );
    });
  }, [heroes, search]);

  const selectHero = (hero: Hero) => {
    onApply(heroMediaPatch(hero));
    setOpen(false);
    setSearch('');
  };

  const renderThumb = (hero: Hero, size: 'sm' | 'md') => {
    const videoUrl = hero.media?.url || null;
    const thumbUrl = hero.media?.thumb_url || null;
    // `thumb_url` is an image: use it as the image source or as the video
    // poster, but never as the `<video>` source.
    const url = hero.type === 'video' ? videoUrl : thumbUrl || videoUrl;
    const box = size === 'md' ? 'h-12 w-20' : 'h-9 w-14';
    if (!url) {
      return (
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded bg-muted text-muted-foreground',
            box
          )}
        >
          {hero.type === 'video' ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
        </div>
      );
    }
    if (hero.type === 'video') {
      // Metadata-only preload keeps large hero videos from downloading here.
      return (
        <video
          src={url}
          poster={thumbUrl ?? undefined}
          muted
          playsInline
          preload="metadata"
          className={cn('shrink-0 rounded bg-black/90 object-cover', box)}
        />
      );
    }
    return (
      <img
        src={url}
        alt=""
        className={cn('shrink-0 rounded object-cover', box)}
      />
    );
  };

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3 sm:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <label className="text-sm font-medium">{t('sections.heroMedia')}</label>
          <p className="text-xs text-muted-foreground">{t('sections.heroMediaHint')}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label={t('common.retry')}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen((prev) => !prev)}
          >
            <Plus className="me-1.5 h-4 w-4" />
            {linkedHero ? t('sections.heroMediaChange') : t('sections.selectHeroMedia')}
          </Button>
        </div>
      </div>

      {/* Linked hero summary */}
      {linkedHero ? (
        <div className="flex items-center gap-3 rounded-md border bg-card p-2">
          {renderThumb(linkedHero, 'md')}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium">Hero #{linkedHero.id}</span>
              <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                {linkedHero.type}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                  linkedHero.is_active
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {linkedHero.is_active ? t('heroes.active') : t('heroes.inactive')}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {heroLabel(linkedHero)}
            </p>
            <p className="truncate text-[11px] text-muted-foreground/80" dir="ltr">
              {linkedHero.media?.url}
            </p>
          </div>
        </div>
      ) : (
        !isLoading &&
        heroes.length > 0 && (
          <p className="text-xs text-muted-foreground">{t('sections.heroMediaNotLinked')}</p>
        )
      )}

      {linkedHero?.type === 'video' && (
        <p className="text-[11px] text-muted-foreground">
          {t('sections.heroMediaSingleFileHint')}
        </p>
      )}

      {/* Hero list */}
      {open && (
        <div className="rounded-md border bg-popover">
          <div className="relative border-b p-2">
            <Search className="absolute start-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('sections.heroMediaSearch')}
              className="h-8 ps-7 text-xs"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-auto p-1">
            {isLoading && (
              <p className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('common.loading')}
              </p>
            )}

            {isError && (
              <div className="flex flex-wrap items-center gap-2 px-2 py-3 text-xs text-destructive">
                <span>{t('sections.heroMediaLoadError')}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t('common.retry')}
                </Button>
              </div>
            )}

            {!isLoading && !isError && heroes.length === 0 && (
              <div className="space-y-2 px-2 py-3 text-xs text-muted-foreground">
                <p>{t('sections.heroMediaEmpty')}</p>
                <Link
                  to="/heroes"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('sections.heroMediaEmptyAction')}
                </Link>
              </div>
            )}

            {!isLoading && !isError && heroes.length > 0 && visibleHeroes.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                {t('sections.heroMediaNoMatch')}
              </p>
            )}

            {visibleHeroes.map((hero) => {
              const isSelected = linkedHero?.id === hero.id;
              return (
                <button
                  key={hero.id}
                  type="button"
                  onClick={() => selectHero(hero)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-start hover:bg-accent',
                    isSelected && 'bg-accent/60'
                  )}
                >
                  {renderThumb(hero, 'sm')}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm">Hero #{hero.id}</span>
                      <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                        {hero.type}
                      </span>
                      {!hero.is_active && (
                        <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                          {t('heroes.inactive')}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {heroLabel(hero)}
                    </span>
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
