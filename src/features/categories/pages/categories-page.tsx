import { useState } from 'react';
import { Download, Plus, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { usePermissions } from '@/shared/auth/guards';
import { useCategories, useToggleFeatured } from '../hooks/use-categories';
import { CategoriesTable } from '../components/categories-table';
import { CategoryFormDialog } from '../components/category-form-dialog';
import { CategoryProductsDialog } from '../components/category-products-dialog';
import { CategoryImportDialog } from '../components/category-import-dialog';
import { CategoryExportDialog } from '../components/category-export-dialog';
import { CATEGORY_PERMISSIONS } from '../permissions/category.permissions';
import { FeaturedCategoriesPage } from './featured-categories-page';
import type { CategoryListItem } from '../types/category.types';

export function CategoriesPage() {
  const { t } = useTranslation();
  const { can: hasPermission } = usePermissions();
  const canImport = hasPermission(CATEGORY_PERMISSIONS.import);
  const canExport = hasPermission(CATEGORY_PERMISSIONS.export);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<string>('all');
  const [parentId, setParentId] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null);
  const [viewTarget, setViewTarget] = useState<CategoryListItem | null>(null);

  const { data, isLoading, isError, refetch } = useCategories({
    page,
    perPage: 15,
    search: search || undefined,
    level: level === 'all' ? undefined : Number(level),
    parentId: parentId === 'all' ? undefined : Number(parentId),
  });

  const { data: rootsData } = useCategories({ level: 1, perPage: 100 });

  const handleEdit = (category: CategoryListItem) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleViewProducts = (category: CategoryListItem) => {
    setViewTarget(category);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingCategory(null);
    refetch();
  };

  const toggleFeaturedMutation = useToggleFeatured();
  const handleToggleFeatured = (category: CategoryListItem) => {
    toggleFeaturedMutation.mutate(category.id, {
      onSuccess: () => refetch(),
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setLevel('all');
    setParentId('all');
    setPage(1);
  };

  const hasActiveFilters = search || level !== 'all' || parentId !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('categories.title')}
        description={t('categories.subtitle')}
        actions={
          <>
            {canImport && (
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="me-2 h-4 w-4" />
                {t('categories.importBtn')}
              </Button>
            )}
            {canExport && (
              <Button variant="outline" onClick={() => setExportOpen(true)}>
                <Download className="me-2 h-4 w-4" />
                {t('categories.exportBtn')}
              </Button>
            )}
            <Button onClick={handleCreate}>
              <Plus className="me-2 h-4 w-4" />
              {t('categories.addCategory')}
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t('categories.allCategories')}</TabsTrigger>
          <TabsTrigger value="featured">{t('categories.featured')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <FilterBar
            activeCount={
              [search].filter(Boolean).length +
              [level, parentId].filter((v) => v !== 'all').length
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder={t('categories.searchPlaceholder')}
              />

              <div className="flex items-center gap-2">
                <FilterSelect
                  value={level}
                  onValueChange={(value) => {
                    setLevel(value);
                    setPage(1);
                  }}
                  prefix={t('categories.level')}
                  allLabel={t('categories.allLevels')}
                  options={[
                    { value: '1', label: t('categories.root') },
                    { value: '2', label: t('categories.sub') },
                    { value: '3', label: t('categories.subSub') },
                  ]}
                  triggerClassName="w-full md:w-auto md:min-w-[170px]"
                />

                <FilterSelect
                  value={parentId}
                  onValueChange={(value) => {
                    setParentId(value);
                    setPage(1);
                  }}
                  prefix={t('categories.parent')}
                  allLabel={t('categories.allParents')}
                  options={(rootsData?.data?.data ?? []).map((root) => ({
                    value: String(root.id),
                    label: root.name,
                  }))}
                  triggerClassName="w-full md:w-auto md:min-w-[190px]"
                />

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    {t('common.clear')}
                  </Button>
                )}
              </div>
            </div>
          </FilterBar>

          {isError && (
            <DataErrorState onRetry={() => refetch()} />
          )}

          <CategoriesTable
            data={data?.data?.data || []}
            isLoading={isLoading}
            onEdit={handleEdit}
            onViewProducts={handleViewProducts}
            onToggleFeatured={handleToggleFeatured}
            onRefresh={refetch}
          />

          <Pagination
            page={page}
            lastPage={data?.data?.last_page ?? 1}
            total={data?.data?.total ?? 0}
            from={data?.data?.from ?? 0}
            to={data?.data?.to ?? 0}
            perPage={data?.data?.per_page ?? 15}
            onPageChange={setPage}
            className="py-2" />
        </TabsContent>

        <TabsContent value="featured">
          <FeaturedCategoriesPage />
        </TabsContent>
      </Tabs>

      <CategoryFormDialog
        category={editingCategory}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />

      <CategoryImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <CategoryExportDialog open={exportOpen} onOpenChange={setExportOpen} />

      {viewTarget && (
        <CategoryProductsDialog
          categoryId={viewTarget.id}
          categoryName={viewTarget.name}
          open={!!viewTarget}
          onOpenChange={(open) => { if (!open) setViewTarget(null); }}
        />
      )}

    </div>
  );
}




