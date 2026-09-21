import { useState } from 'react';
import { Download, Plus, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { usePermissions } from '@/shared/auth/guards';
import { useBrands } from '../hooks/use-brands';
import { BrandsTable } from '../components/brands-table';
import { BrandFormDialog } from '../components/brand-form-dialog';
import { BrandImportDialog } from '../components/brand-import-dialog';
import { BrandExportDialog } from '../components/brand-export-dialog';
import { BRAND_PERMISSIONS } from '../permissions/brand.permissions';
import type { Brand } from '../types/brand.types';

export function BrandsPage() {
  const { t } = useTranslation();
  const { can: hasPermission } = usePermissions();
  const canImport = hasPermission(BRAND_PERMISSIONS.import);
  const canExport = hasPermission(BRAND_PERMISSIONS.export);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [order, setOrder] = useState('id');
  const [sortedBy, setSortedBy] = useState('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
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

  const { data, isLoading, isError, refetch } = useBrands(params);

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
      <PageHeader
        title={t('brands.title')}
        description={t('brands.subtitle')}
        actions={
          <>
            {canImport && (
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="me-2 h-4 w-4" />
                {t('brands.importBtn')}
              </Button>
            )}
            {canExport && (
              <Button variant="outline" onClick={() => setExportOpen(true)}>
                <Download className="me-2 h-4 w-4" />
                {t('brands.exportBtn')}
              </Button>
            )}
            <Button onClick={handleCreate}>
              <Plus className="me-2 h-4 w-4" />
              {t('brands.addBrand')}
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
            placeholder={t('brands.searchPlaceholder')}
          />

          {search && (
            <Button variant="ghost" size="sm" onClick={handleClearSearch}>
              {t('common.clear')}
            </Button>
          )}

          <FilterSelect
            value={activeFilter}
            onValueChange={(v) => {
              setActiveFilter(v);
              setPage(1);
            }}
            prefix={t('common.status')}
            allLabel={t('brands.allStatuses')}
            options={[
              { value: '1', label: t('brands.active') },
              { value: '0', label: t('brands.inactive') },
            ]}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
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
      </FilterBar>

      {isError && (
        <DataErrorState onRetry={() => refetch()} />
      )}

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

      <BrandImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <BrandExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
