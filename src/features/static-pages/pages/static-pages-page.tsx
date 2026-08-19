import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { STATIC_PAGE_PERMISSIONS } from '../permissions/static-pages.permissions';
import { useStaticPages } from '../hooks/use-static-pages';
import { StaticPagesTable } from '../components/static-pages-table';
import { StaticPageFormDialog } from '../components/static-page-form-dialog';
import type { StaticPage } from '../types/static-page.types';

export function StaticPagesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{t('staticPages.pageTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('staticPages.pageDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

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