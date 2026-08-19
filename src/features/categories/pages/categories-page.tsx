import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/components/pagination';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useCategories, useToggleFeatured } from '../hooks/use-categories';
import { CategoriesTable } from '../components/categories-table';
import { CategoryFormDialog } from '../components/category-form-dialog';
import { CategoryProductsDialog } from '../components/category-products-dialog';
import { FeaturedCategoriesPage } from './featured-categories-page';
import type { CategoryListItem } from '../types/category.types';

export function CategoriesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null);
  const [viewTarget, setViewTarget] = useState<CategoryListItem | null>(null);

  const { data, isLoading, refetch } = useCategories({
    page,
    perPage: 15,
    search: search || undefined,
    level: level === 'all' ? undefined : Number(level),
  });

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
    setPage(1);
  };

  const hasActiveFilters = search || level !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('categories.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('categories.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('categories.addCategory')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t('categories.allCategories')}</TabsTrigger>
          <TabsTrigger value="featured">{t('categories.featured')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('categories.searchPlaceholder')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="ps-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={level}
                onValueChange={(value) => {
                  setLevel(value ?? 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder={t('categories.allLevels')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('categories.allLevels')}</SelectItem>
                  <SelectItem value="1">{t('categories.root')} </SelectItem>
                  <SelectItem value="2">{t('categories.sub')} </SelectItem>
                  <SelectItem value="3">{t('categories.subSub')} </SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  {t('common.clear')}
                </Button>
              )}
            </div>
          </div>

          <CategoriesTable
            data={data?.data?.data || []}
            isLoading={isLoading}
            onEdit={handleEdit}
            onViewProducts={handleViewProducts}
            onToggleFeatured={handleToggleFeatured}
            onRefresh={refetch}
            parentMap={new Map(
              (data?.data?.data ?? []).map((c) => [c.id, c.name])
            )}
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




