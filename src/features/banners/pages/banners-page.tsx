import { useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { BannersTable } from '../components/banners-table';
import { BannerFormDialog } from '../components/banner-form-dialog';
import { useBanners } from '../hooks/use-banners';
import type { Banner } from '../types/banner.types';

export function BannersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [order, setOrder] = useState('created_at');
  const [sortedBy, setSortedBy] = useState('desc');
  const [openForm, setOpenForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const params = {
    page,
    perPage,
    search: search || undefined,
    active: activeFilter === 'active' ? true : undefined,
    inactive: activeFilter === 'inactive' ? true : undefined,
    order: order || undefined,
    sortedBy: sortedBy || undefined,
  };

  const { data, isLoading, isError, refetch } = useBanners(params);

  const banners = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;

  const handleEdit = useCallback((banner: Banner) => {
    setEditingBanner(banner);
    setOpenForm(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingBanner(null);
    setOpenForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setOpenForm(false);
    setEditingBanner(null);
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('banners.pageTitle')}
        description={t('banners.subtitle')}
        actions={
          <>
            <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
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
          [search].filter(Boolean).length +
          [activeFilter].filter((v) => v !== 'all').length
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('banners.searchPlaceholder')}
          />
          <FilterSelect
            value={activeFilter}
            onValueChange={(v) => {
              setActiveFilter(v);
              setPage(1);
            }}
            prefix={t('common.status')}
            allLabel={t('banners.allStatuses')}
            options={[
              { value: 'active', label: t('banners.active') },
              { value: 'inactive', label: t('banners.inactive') },
            ]}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
          <Select value={order} onValueChange={(v) => { if (v) setOrder(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[150px]">
              <SelectValue placeholder={t('banners.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">{t('banners.sortCreatedAt')}</SelectItem>
              <SelectItem value="title">{t('banners.sortTitle')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortedBy} onValueChange={(v) => { if (v) setSortedBy(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[120px]">
              <SelectValue placeholder={t('banners.sortedBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">{t('banners.asc')}</SelectItem>
              <SelectItem value="desc">{t('banners.desc')}</SelectItem>
            </SelectContent>
          </Select>
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

      <BannersTable
        data={banners}
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

      <BannerFormDialog
        banner={editingBanner}
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
