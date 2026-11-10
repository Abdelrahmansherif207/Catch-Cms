import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { PageBackHeader } from '@/shared/components/page-header';
import { SectionFormContent } from '../components/section-form-content';
import { useSection } from '../hooks/use-sections';

function EditPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-card sm:p-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Full-page section editor for an existing section (`/cms/:id/edit`). */
export function SectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sectionId = Number(id);
  const { data, isLoading } = useSection(sectionId);
  const detail = data?.data;

  if (isLoading && sectionId) {
    return <EditPageSkeleton />;
  }

  if (!detail) {
    return (
      <div className="space-y-6">
        <PageBackHeader title={t('sections.editSection')} backTo="/cms" />
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-20 shadow-card">
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/cms')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SectionFormContent
      key={detail.id}
      section={detail}
      onSuccess={() => navigate('/cms')}
      onCancel={() => navigate('/cms')}
    />
  );
}
