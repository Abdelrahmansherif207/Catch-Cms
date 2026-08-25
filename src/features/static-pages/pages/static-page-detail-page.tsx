import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Loader2, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { useLanguage } from '@/shared/hooks/use-language';
import { usePermissions } from '@/shared/auth/guards';
import { STATIC_PAGE_PERMISSIONS } from '../permissions/static-pages.permissions';
import { useStaticPage } from '../hooks/use-static-pages';
import { localizedText } from '../lib/static-page-utils';
import { SectionsTable } from '../components/sections/sections-table';
import { SectionFormDialog } from '../components/sections/section-form-dialog';
import type { StaticPageSection } from '../types/static-page.types';

export function StaticPageDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug = '' } = useParams();
  const { language } = useLanguage();
  const { can: hasPermission } = usePermissions();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<StaticPageSection | null>(null);

  const { data, isLoading, isError, refetch } = useStaticPage(slug);
  const page = data?.data;

  const canCreate = hasPermission(STATIC_PAGE_PERMISSIONS.createSection);
  const canEdit = hasPermission(STATIC_PAGE_PERMISSIONS.updateSection);
  const canDelete = hasPermission(STATIC_PAGE_PERMISSIONS.deleteSection);

  const sections = [...(page?.sections ?? [])].sort((a, b) => a.order - b.order);

  const handleAdd = () => {
    setEditingSection(null);
    setFormOpen(true);
  };

  const handleEdit = (section: StaticPageSection) => {
    setEditingSection(section);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingSection(null);
    refetch();
  };

  const title = localizedText(page?.title, language);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/static-pages')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                {isLoading ? <Skeleton className="h-6 w-40" /> : title}
              </h1>
              {page && (
                <Badge variant="outline" className="font-mono text-xs">
                  /{page.slug}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t('staticPages.sectionsSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/static-pages/${slug}/preview`)}>
            <Eye className="me-1.5 h-4 w-4" />
            {t('staticPages.preview')}
          </Button>
          {canCreate && (
            <Button onClick={handleAdd}>
              <Plus className="me-1.5 h-4 w-4" />
              {t('staticPages.addSection')}
            </Button>
          )}
        </div>
      </div>

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{t('staticPages.detailLoadError')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      <SectionsTable
        slug={slug}
        data={sections}
        isLoading={isLoading}
        lang={language}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onRefresh={() => refetch()}
      />

      {page && (
        <SectionFormDialog
          key={`${formOpen ? 'open' : 'closed'}-${editingSection?.id ?? 'create'}`}
          slug={slug}
          section={editingSection}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={handleFormSuccess}
        />
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}