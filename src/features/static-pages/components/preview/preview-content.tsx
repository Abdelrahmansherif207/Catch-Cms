import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import type { Language } from '@/shared/constants/api';
import type { JsonObject, JsonValue, StaticPageSection } from '../../types/static-page.types';

// Generic renderer for the free-form per-locale content object.
// Renders any JSON shape: primitives, nested objects, and arrays.
export function PreviewContent({ value }: { value: JsonObject }) {
  const { t } = useTranslation();
  const entries = Object.entries(value);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('staticPages.previewPage.noContent')}</p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, val]) => (
        <div key={key} className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {key}
          </span>
          <div className="text-sm text-foreground/90">
            <RenderValue value={val} depth={0} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Typed section preview (contract: text|image|video|screenshot) ──

function contentString(content: JsonObject | null, key: string): string | null {
  if (!content) return null;
  const value = content[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function configPoster(config: StaticPageSection['config']): string | undefined {
  if (!config || typeof config !== 'object') return undefined;
  const poster = (config as Record<string, unknown>).poster;
  return typeof poster === 'string' && poster.length > 0 ? poster : undefined;
}

export function SectionPreview({ section, lang }: { section: StaticPageSection; lang: Language }) {
  const { t } = useTranslation();
  const content = (section.content?.[lang] ?? section.content?.en ?? null) as JsonObject | null;
  const type = section.type ?? 'text';
  const media = section.media;

  if (type === 'image' || type === 'screenshot') {
    const alt = contentString(content, 'alt') ?? '';
    const caption = contentString(content, 'caption');
    return (
      <div className="space-y-2">
        {media ? (
          <figure className="space-y-2">
            <img
              src={media.url}
              alt={alt}
              className="max-h-96 w-full rounded-md object-contain bg-muted/30"
              loading="lazy"
            />
            {caption && <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>}
          </figure>
        ) : (
          <p className="text-sm text-muted-foreground">{t('staticPages.previewPage.noMedia', 'No media uploaded.')}</p>
        )}
        {content && Object.keys(content).filter((k) => k !== 'alt' && k !== 'caption').length > 0 && (
          <PreviewContent
            value={Object.fromEntries(Object.entries(content).filter(([k]) => k !== 'alt' && k !== 'caption'))}
          />
        )}
      </div>
    );
  }

  if (type === 'video') {
    const caption = contentString(content, 'caption');
    return (
      <div className="space-y-2">
        {media ? (
          <figure className="space-y-2">
            <video
              src={media.url}
              poster={configPoster(section.config)}
              controls
              playsInline
              preload="metadata"
              className="max-h-96 w-full rounded-md bg-black"
            />
            {caption && <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>}
          </figure>
        ) : (
          <p className="text-sm text-muted-foreground">{t('staticPages.previewPage.noMedia', 'No media uploaded.')}</p>
        )}
        {content && Object.keys(content).filter((k) => k !== 'caption').length > 0 && (
          <PreviewContent
            value={Object.fromEntries(Object.entries(content).filter(([k]) => k !== 'caption'))}
          />
        )}
      </div>
    );
  }

  // type=text — render `body` prominently, then any extra keys generically.
  if (!content || Object.keys(content).length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('staticPages.previewPage.noContent')}</p>
    );
  }
  const body = contentString(content, 'body');
  const rest = Object.fromEntries(Object.entries(content).filter(([k]) => k !== 'body'));
  return (
    <div className="space-y-3">
      {body && <p className="whitespace-pre-line text-sm leading-6 text-foreground/90">{body}</p>}
      {Object.keys(rest).length > 0 && <PreviewContent value={rest} />}
    </div>
  );
}

export function SectionTypeBadge({ type }: { type: StaticPageSection['type'] }) {
  return (
    <Badge variant="outline" className="font-mono text-2xs">
      {type ?? 'text'}
    </Badge>
  );
}

function RenderValue({ value, depth }: { value: JsonValue; depth: number }) {
  if (value === null) {
    return <span className="text-muted-foreground">null</span>;
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground">[]</span>;
      }
      return (
        <ul className={depth > 0 ? 'ps-4 list-disc space-y-0.5' : 'space-y-0.5'}>
          {value.map((item, i) => (
            <li key={i}>
              <RenderValue value={item} depth={depth + 1} />
            </li>
          ))}
        </ul>
      );
    }
    const entries = Object.entries(value as JsonObject);
    if (entries.length === 0) {
      return <span className="text-muted-foreground">{'{ }'}</span>;
    }
    return (
      <dl className={depth > 0 ? 'ps-4 space-y-1' : 'space-y-1'}>
        {entries.map(([key, item]) => (
          <Fragment key={key}>
            <dt className="text-xs font-medium text-muted-foreground">{key}</dt>
            <dd className="text-sm">
              <RenderValue value={item} depth={depth + 1} />
            </dd>
          </Fragment>
        ))}
      </dl>
    );
  }

  if (typeof value === 'boolean') {
    return <span>{value ? 'true' : 'false'}</span>;
  }

  return <span>{String(value)}</span>;
}
