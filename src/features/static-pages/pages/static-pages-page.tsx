import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { usePermissions } from '@/shared/auth/guards';
import { STATIC_PAGE_PERMISSIONS } from '../permissions/static-pages.permissions';
import { useStaticPages } from '../hooks/use-static-pages';
import { StaticPagesTable } from '../components/static-pages-table';
import { StaticPageFormDialog } from '../components/static-page-form-dialog';
import type { StaticPage } from '../types/static-page.types';

export function StaticPagesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can: hasPermission } = usePermissions();
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useStaticPages();
  const pages = data?.data ?? [];

  const canUpdate = hasPermission(STATIC_PAGE_PERMISSIONS.update);

  const handleEdit = (page: StaticPage) => {
    setEditingPage(page);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingPage(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('staticPages.pageTitle')}
        description={t('staticPages.pageDescription')}
        actions={
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {isError && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{t('staticPages.listError')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      <StaticPagesTable
        data={pages}
        isLoading={isLoading}
        canUpdate={canUpdate}
        onEdit={handleEdit}
        onViewSections={(page) => navigate(`/static-pages/${page.slug}`)}
        onPreview={(page) => navigate(`/static-pages/${page.slug}/preview`)}
      />

      <StaticPageFormDialog
        page={editingPage}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
