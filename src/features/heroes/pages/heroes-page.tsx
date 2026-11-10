import { useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { HeroesTable } from '../components/heroes-table';
import { HeroFormDialog } from '../components/hero-form-dialog';
import { useHeroes } from '../hooks/use-heroes';
import type { Hero, FetchHeroesParams } from '../types/hero.types';

export function HeroesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [openForm, setOpenForm] = useState(false);
  const [editingHero, setEditingHero] = useState<Hero | null>(null);

  const isActive =
    statusFilter === 'active' ? true
      : statusFilter === 'inactive' ? false
        : undefined;
  const heroType: FetchHeroesParams['type'] =
    typeFilter === 'image' ? 'image'
      : typeFilter === 'video' ? 'video'
        : 'all';
  const params: FetchHeroesParams = {
    page,
    perPage,
    isActive,
    type: heroType,
  };

  const { data, isLoading, isError, refetch } = useHeroes(params);

  const heroes = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;

  const handleEdit = useCallback((hero: Hero) => {
    setEditingHero(hero);
    setOpenForm(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingHero(null);
    setOpenForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setOpenForm(false);
    setEditingHero(null);
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('heroes.pageTitle')}
        description={t('heroes.subtitle')}
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
            <Button onClick={handleCreate}>
              <Plus className="me-1.5 h-4 w-4" />
              {t('common.create')}
            </Button>
          </>
        }
      />

      <FilterBar
        activeCount={
          [statusFilter, typeFilter].filter((v) => v !== 'all').length
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            prefix={t('common.status')}
            allLabel={t('heroes.allStatuses')}
            options={[
              { value: 'active', label: t('heroes.active') },
              { value: 'inactive', label: t('heroes.inactive') },
            ]}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
          <FilterSelect
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
            prefix={t('heroes.heroType')}
            allLabel={t('heroes.allTypes')}
            options={[
              { value: 'image', label: t('heroes.typeImage') },
              { value: 'video', label: t('heroes.typeVideo') },
            ]}
            triggerClassName="w-full md:w-auto md:min-w-[170px]"
          />
          <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      {isError && (
        <DataErrorState onRetry={() => refetch()} />
      )}

      <HeroesTable
        data={heroes}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefresh={() => refetch()}
      />

      <Pagination
        page={page}
        lastPage={lastPage}
        total={total}
        from={from}
        to={to}
        perPage={perPage}
        onPageChange={setPage}
      />

      <HeroFormDialog
        hero={editingHero}
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
