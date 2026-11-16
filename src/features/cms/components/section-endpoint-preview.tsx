import { useDeferredValue } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useSectionPreviewCount } from '../hooks/use-sections';

interface SectionEndpointPreviewProps {
  /** Built effective endpoint, e.g. "general/products?type=…&limit=…". */
  endpoint: string;
}

/**
 * Shows the endpoint the section will resolve to (built from the current
 * editor state the same way the saved `endpoint` is built) plus a live item
 * count fetched with a small limit. A zero count warns loudly that the
 * section will render nothing; failures stay non-blocking.
 */
export function SectionEndpointPreview({ endpoint }: SectionEndpointPreviewProps) {
  const { t } = useTranslation();
  // The endpoint changes on every keystroke; the deferred value keeps the
  // live count one render behind instead of firing a request per keystroke.
  const deferredEndpoint = useDeferredValue(endpoint);
  const {
    data: total,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useSectionPreviewCount(deferredEndpoint || undefined);

  if (!endpoint) return null;

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t('sections.previewEndpoint')}</p>
        {isFetching && !isLoading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      <code className="block break-all font-mono text-xs text-muted-foreground">
        {endpoint}
      </code>
      {isLoading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('sections.previewChecking')}
        </p>
      ) : isError ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('sections.previewUnavailable')}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            {t('common.retry')}
          </Button>
        </div>
      ) : total === 0 ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {t('sections.previewEmpty')}
        </p>
      ) : typeof total === 'number' ? (
        <p className="text-xs text-muted-foreground">
          {t('sections.previewCount', { count: total })}
        </p>
      ) : null}
    </div>
  );
}
