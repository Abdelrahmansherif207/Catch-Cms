import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { SectionsTable } from '../components/sections-table';
import { useSections } from '../hooks/use-sections';

export function SectionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useSections();
  const sections = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('sections.pageTitle')}
        description={t('sections.pageDescription')}
        actions={
          <>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => refetch()}
              aria-label={t('common.refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/cms/new')}>
              <Plus className="me-1.5 h-4 w-4" />
              {t('sections.addSection')}
            </Button>
          </>
        }
      />

      {isError ? (
        <DataErrorState onRetry={() => void refetch()} />
      ) : (
        <SectionsTable
          data={sections}
          isLoading={isLoading}
          onEdit={(section) => navigate(`/cms/${section.id}/edit`)}
          onRefresh={() => refetch()}
        />
      )}
    </div>
  );
}
