import { useEffect } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Badge } from '@/shared/ui/badge';
import { useLanguage } from '@/shared/hooks/use-language';
import { useStaticPagePreview } from '../hooks/use-static-pages';
import { resolveLocaleContent, sectionTitle } from '../lib/static-page-utils';
import type { StaticPageSection } from '../types/static-page.types';
import type { ApiErrorResponse } from '@/shared/api';
import { SectionErrorBoundary } from '../components/preview/section-error-boundary';
import { PreviewContent } from '../components/preview/preview-content';

export function StaticPagePreviewPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const { language } = useLanguage();
  const { data, isLoading, isError, error, refetch } = useStaticPagePreview(slug, language);

  useEffect(() => {
    if (isError) {
      const apiError = error as unknown as ApiErrorResponse;
      if (apiError?.status !== 404) {
        toast.error(apiError?.message || t('staticPages.previewPage.loadError'));
      }
    }
  }, [isError, error, t]);

  if (isLoading) {
    return <PreviewSkeleton />;
  }

  if (isError) {
    const apiError = error as unknown as ApiErrorResponse;
    if (apiError?.status === 404) {
      return <NotFoundState />;
    }
    return (
      <ErrorState
        message={apiError?.message || t('staticPages.previewPage.loadError')}
        onRetry={() => refetch()}
      />
    );
  }

  const page = data?.data;

  if (!page) {
    return <NotFoundState />;
  }

  if (!page.is_active) {
    return <NotFoundState />;
  }

  const sections = [...(page.sections ?? [])].sort((a, b) => a.order - b.order);

  const title =
    typeof page.title === 'string'
      ? page.title
      : page.title?.[language] || page.title?.en || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <Badge variant="outline" className="font-mono text-xs">
              /{page.slug}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{t('staticPages.previewPage.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="me-1.5 h-4 w-4" />
          {t('common.retry')}
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-lg border">
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t('staticPages.previewPage.noContent')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <PreviewSection key={section.id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewSection({ section }: { section: StaticPageSection }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const content = resolveLocaleContent(section.content, language);

  return (
    <SectionErrorBoundary
      fallback={
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{t('staticPages.previewPage.sectionError')}</p>
        </div>
      }
    >
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">{sectionTitle(section, language)}</h2>
        {content ? (
          <PreviewContent value={content} />
        ) : (
          <p className="text-sm text-muted-foreground">{t('staticPages.previewPage.noContent')}</p>
        )}
      </section>
    </SectionErrorBoundary>
  );
}

function NotFoundState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">{t('staticPages.previewPage.notFound')}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t('staticPages.previewPage.notFoundHint')}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h1 className="text-xl font-semibold">{t('staticPages.previewPage.loadErrorTitle')}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry}>
        <RefreshCw className="me-1.5 h-4 w-4" />
        {t('common.retry')}
      </Button>
    </div>
  );
}

function PreviewSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-lg border bg-card p-5">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
      <p className="sr-only">{t('staticPages.previewPage.loading')}</p>
    </div>
  );
}