import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  ImageOff,
  Info,
  Loader2,
  RefreshCw,
  TicketPercent,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Language } from '@/shared/constants/api';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { useSectionPreview } from '../hooks/use-section-preview';
import { withPreviewLimit } from '../lib/section-preview';
import {
  SECTION_PREVIEW_MAX_ITEMS,
  formatPreviewAmount,
  formatPreviewNumber,
  resolvePreviewMatch,
  type PreviewCard,
  type SectionPreviewType,
} from '../lib/section-preview-data';

export interface SectionPreviewFilter {
  /** Already translated: "Categories" or "Category". */
  label: string;
  count: number;
  /** One-value filter whose picker already cached the name. */
  singleValue?: string | null;
}

interface SectionEndpointPreviewProps {
  /** Effective endpoint built from the current (unsaved) form values. */
  endpoint: string;
  sectionType: SectionPreviewType;
  /** Products mode; other types behave like Custom (no preset). */
  mode: 'preset' | 'custom';
  /** Human label for the selected Preset (products only). */
  presetLabel?: string | null;
  /** Active Custom filters with translated labels (products only). */
  filters?: SectionPreviewFilter[];
  /** False when Preset is selected but no template is chosen yet. */
  enabled: boolean;
  /** Effective desktop column count (1–8). */
  columnsCount: number;
  /** Items requested from the endpoint: min(section limit, 12). */
  requestLimit: number;
}

const CAPTION_NOUN: Record<SectionPreviewType, string> = {
  products: 'products',
  categories: 'categories',
  brands: 'brands',
  coupons: 'coupons',
};

const CARD_GAP_REM = 0.5;
const CARD_MIN_WIDTH = '7rem';

export function SectionEndpointPreview({
  endpoint,
  sectionType,
  mode,
  presetLabel,
  filters = [],
  enabled,
  columnsCount,
  requestLimit,
}: SectionEndpointPreviewProps) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const resultsId = useId();
  const [expanded, setExpanded] = useState(false);

  const language: Language = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const isProducts = sectionType === 'products';
  const safeLimit = Math.max(
    1,
    Math.min(
      SECTION_PREVIEW_MAX_ITEMS,
      Math.round(requestLimit) || SECTION_PREVIEW_MAX_ITEMS
    )
  );
  const columns = Math.max(1, Math.min(8, Math.round(columnsCount) || 4));
  const fetchEndpoint =
    enabled && endpoint ? withPreviewLimit(endpoint, safeLimit) : '';
  // `buildSectionEndpoint` appends `?` even when there are no params.
  const displayEndpoint =
    endpoint.endsWith('?') ? endpoint.slice(0, -1) : endpoint;

  const {
    items,
    total,
    receivedCount,
    isLoading,
    isFetching,
    isError,
    refetch,
    isDebouncing,
  } = useSectionPreview({
    endpoint: fetchEndpoint,
    type: sectionType,
    language,
    enabled: enabled && Boolean(endpoint),
  });

  const match = resolvePreviewMatch(total, receivedCount, safeLimit);
  const formattedCount = formatPreviewNumber(match.count, language);
  const formattedLimit = formatPreviewNumber(safeLimit, language);

  const isAllProducts = isProducts && mode === 'custom' && filters.length === 0;
  const filterSummary = filters
    .map((filter) =>
      filter.singleValue
        ? `${filter.label}: ${filter.singleValue}`
        : `${filter.label}: ${formatPreviewNumber(filter.count, language)}`
    )
    .join(' · ');

  const subjectLabel = isProducts
    ? isAllProducts
      ? t('sections.previewAllProducts')
      : mode === 'preset'
        ? (presetLabel ?? '').trim()
        : filterSummary
    : '';

  const matchText = (() => {
    if (!isProducts) {
      const noun = t(`sections.previewFilter.${CAPTION_NOUN[sectionType]}`);
      return match.isAtLeast
        ? t('sections.previewMatchEntitiesMore', {
            total: formattedCount,
            items: noun,
          })
        : t('sections.previewMatchEntities', {
            total: formattedCount,
            items: noun,
          });
    }
    if (isAllProducts) {
      return match.isAtLeast
        ? t('sections.previewMatchCountMore', { total: formattedCount })
        : t('sections.previewMatchCount', { total: formattedCount });
    }
    return match.isAtLeast
      ? t('sections.previewMatchProductsMore', { total: formattedCount })
      : t('sections.previewMatchProducts', { total: formattedCount });
  })();

  const showingFirst = match.isTruncated
    ? ` ${t('sections.previewShowingFirst', { limit: formattedLimit })}`
    : '';
  const caption = subjectLabel
    ? `${subjectLabel}: ${matchText}${showingFirst}`
    : `${matchText}${showingFirst}`;

  const emptyText =
    isProducts && mode === 'custom' && filters.length > 0
      ? t('sections.previewEmptyProductsCustom')
      : isProducts
        ? t('sections.previewEmptyProducts')
        : t('sections.previewEmptyGeneric');

  const hasResults = !isLoading && !isError && items.length > 0;
  const canExpand = hasResults && items.length > columns;
  const cardWidth = `calc((100% - ${(columns - 1) * CARD_GAP_REM}rem) / ${columns})`;
  const isBusy = isFetching || isDebouncing;
  // After enabling the preview (e.g. picking a preset) the debounce window
  // still holds the previous empty endpoint: keep skeletons up instead of
  // flashing the empty state before the first request starts.
  const showSkeleton = isLoading || (isDebouncing && items.length === 0);

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(displayEndpoint);
      toast.success(t('sections.previewCopied'));
    } catch {
      toast.error(t('sections.previewCopyFailed'));
    }
  };

  return (
    <div
      className="space-y-2 rounded-lg border bg-muted/30 p-3"
      aria-labelledby={titleId}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={titleId} className="text-sm font-medium">
          {t('sections.previewResultsTitle')}
        </p>
        <div className="flex items-center gap-1.5">
          {enabled && isBusy && (
            <Loader2
              className="h-3.5 w-3.5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          )}
          {enabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => void refetch()}
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', isBusy && 'animate-spin')}
                aria-hidden="true"
              />
              {t('common.refresh')}
            </Button>
          )}
        </div>
      </div>

      {!enabled ? (
        <p className="flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t('sections.previewChoosePreset')}</span>
        </p>
      ) : !endpoint ? null : (
        <>
          {showSkeleton ? (
            <Skeleton className="h-3 w-3/4" />
          ) : isError || items.length === 0 ? null : (
            <div className="space-y-1">
              <p
                className={cn(
                  'text-xs text-muted-foreground',
                  isBusy && 'opacity-70'
                )}
              >
                {caption}
              </p>
              {isProducts && mode === 'custom' && filters.length >= 2 && (
                <p className="text-[11px] text-muted-foreground">
                  {t('sections.previewFilterHint')}
                </p>
              )}
            </div>
          )}

          {showSkeleton ? (
            <div className="flex gap-2 overflow-hidden pb-1">
              {Array.from({ length: columns }).map((_, index) => (
                <PreviewCardSkeleton key={index} width={cardWidth} />
              ))}
            </div>
          ) : isError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"
            >
              <AlertTriangle
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{t('sections.previewError')}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ms-auto h-7"
                onClick={() => void refetch()}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                {t('common.retry')}
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-start gap-1.5 rounded-md border border-dashed bg-background/40 p-2 text-xs text-muted-foreground">
              <Info
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{emptyText}</span>
            </div>
          ) : expanded ? (
            <div
              id={resultsId}
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_MIN_WIDTH}, 1fr))`,
              }}
            >
              {items.map((card) => (
                <PreviewCardTile
                  key={card.id}
                  card={card}
                  language={language}
                />
              ))}
            </div>
          ) : (
            <div
              id={resultsId}
              className={cn(
                'flex gap-2 overflow-x-auto pb-1',
                isBusy && 'opacity-70'
              )}
            >
              {items.map((card) => (
                <PreviewCardTile
                  key={card.id}
                  card={card}
                  language={language}
                  width={cardWidth}
                />
              ))}
            </div>
          )}

          {canExpand && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              aria-expanded={expanded}
              aria-controls={resultsId}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {expanded
                ? t('sections.previewShowLess')
                : t('sections.previewShowAll', { count: items.length })}
            </Button>
          )}

          <details className="rounded-md border bg-background/50 px-2.5 py-2">
            <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground">
              {t('sections.previewTechnicalDetails')}
            </summary>
            <div className="mt-2 space-y-2">
              <code
                dir="ltr"
                className="block break-all rounded bg-muted/60 p-2 text-start font-mono text-[11px] leading-relaxed text-muted-foreground"
              >
                {displayEndpoint}
              </code>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={() => void handleCopy()}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('common.copy')}
                </Button>
              </div>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function PreviewCardTile({
  card,
  language,
  width,
}: {
  card: PreviewCard;
  language: Language;
  width?: string;
}) {
  return (
    <div
      className="flex min-w-0 shrink-0 flex-col rounded-lg border bg-card p-2"
      style={width ? { width, minWidth: CARD_MIN_WIDTH } : undefined}
    >
      {card.kind === 'coupon' ? (
        <div className="mb-1.5 flex aspect-square items-center justify-center rounded-md bg-primary/5">
          <TicketPercent
            className="h-6 w-6 text-primary/60"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="mb-1.5 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-muted/60">
          {card.image ? (
            <img
              src={card.image}
              alt=""
              loading="lazy"
              className={cn(
                'h-full w-full',
                card.kind === 'brand' ? 'object-contain p-1' : 'object-cover'
              )}
            />
          ) : (
            <ImageOff
              className="h-5 w-5 text-muted-foreground/60"
              aria-hidden="true"
            />
          )}
        </div>
      )}

      {card.kind === 'coupon' ? (
        <>
          <p
            dir="ltr"
            className="text-start font-mono text-xs font-semibold leading-4"
          >
            {card.code}
          </p>
          {card.value ? (
            <p className="mt-0.5 text-[11px] font-semibold text-primary">
              {card.value}
            </p>
          ) : null}
          {card.name && card.name !== card.code ? (
            <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
              {card.name}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="line-clamp-2 min-h-8 text-xs font-medium leading-4">
            {card.name}
          </p>
          {card.kind === 'product' && card.price !== null ? (
            <p className="mt-0.5 flex flex-wrap items-baseline gap-1">
              <span className="text-xs font-semibold tabular-nums">
                {formatPreviewAmount(card.price, card.currency, language)}
              </span>
              {card.originalPrice !== null ? (
                <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                  {formatPreviewAmount(
                    card.originalPrice,
                    card.currency,
                    language
                  )}
                </span>
              ) : null}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function PreviewCardSkeleton({ width }: { width: string }) {
  return (
    <div
      className="flex shrink-0 flex-col rounded-lg border bg-card p-2"
      style={{ width, minWidth: CARD_MIN_WIDTH }}
    >
      <Skeleton className="mb-1.5 aspect-square w-full rounded-md" />
      <Skeleton className="mb-1 h-3 w-4/5" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
