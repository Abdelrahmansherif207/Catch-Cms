import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Pagination } from '@/shared/components/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useBrands } from '../hooks/use-brands';
import { BrandsTable } from '../components/brands-table';
import { BrandFormDialog } from '../components/brand-form-dialog';
import type { Brand } from '../types/brand.types';

export function BrandsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [order, setOrder] = useState('id');
  const [sortedBy, setSortedBy] = useState('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const params = {
    page,
    perPage,
    search: search || undefined,
    active: activeFilter === '1' ? true : activeFilter === '0' ? false : undefined,
    inactive: activeFilter === '0' ? true : undefined,
    order: order || undefined,
    sortedBy: sortedBy || undefined,
  };

  const { data, isLoading, refetch } = useBrands(params);

  const brands = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;
  const lastPage = data?.data?.last_page ?? 1;

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingBrand(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingBrand(null);
    refetch();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('brands.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('brands.subtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('brands.addBrand')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('brands.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="ps-9"
          />
        </div>

        {search && (
          <Button variant="ghost" size="sm" onClick={handleClearSearch}>
            {t('common.clear')}
          </Button>
        )}

        <Select value={activeFilter} onValueChange={(v) => v && (setActiveFilter(v), setPage(1))}>
          <SelectTrigger className="h-8 w-full md:w-[130px]">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('brands.allStatuses')}</SelectItem>
            <SelectItem value="1">{t('brands.active')}</SelectItem>
            <SelectItem value="0">{t('brands.inactive')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={order} onValueChange={(v) => v && (setOrder(v), setPage(1))}>
          <SelectTrigger className="h-8 w-full md:w-[150px]">
            <SelectValue placeholder={t('brands.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t('brands.sortName')}</SelectItem>
            <SelectItem value="slug">Slug</SelectItem>
            <SelectItem value="status">{t('brands.sortStatus')}</SelectItem>
            <SelectItem value="created_at">{t('brands.sortCreatedAt')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortedBy} onValueChange={(v) => v && (setSortedBy(v), setPage(1))}>
          <SelectTrigger className="h-8 w-full md:w-[120px]">
            <SelectValue placeholder={t('brands.sortedBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{t('brands.asc')}</SelectItem>
            <SelectItem value="desc">{t('brands.desc')}</SelectItem>
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

      <BrandsTable
        data={brands}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefresh={refetch}
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

      <BrandFormDialog
        brand={editingBrand}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
