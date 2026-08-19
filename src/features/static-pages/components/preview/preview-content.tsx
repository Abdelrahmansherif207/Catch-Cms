import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import type { JsonObject, JsonValue } from '../../types/static-page.types';

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