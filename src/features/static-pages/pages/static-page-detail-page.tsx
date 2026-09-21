import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Eye, Loader2, Newspaper, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { PageBackHeader } from '@/shared/components/page-header';
import { DetailHero } from '@/shared/components/detail-hero';
import { CardSection } from '@/shared/components/card-section';
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

  const title = localizedText(page?.title, language) || slug;

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={title}
        description={t('staticPages.sectionsSubtitle')}
        backTo="/static-pages"
      />

      <DetailHero
        icon={Newspaper}
        title={title}
        badges={
          page && (
            <Badge variant="outline" className="font-mono text-xs">
              /{page.slug}
            </Badge>
          )
        }
        facts={[
          { label: t('staticPages.slug'), value: page ? `/${page.slug}` : `/${slug}` },
          { label: t('staticPages.sections'), value: sections.length },
        ]}
        actions={
          <>
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
          </>
        }
      />

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{t('staticPages.detailLoadError')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      <CardSection
        title={t('staticPages.sections')}
        description={t('staticPages.sectionsSubtitle')}
      >
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
      </CardSection>

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
