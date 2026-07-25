import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Plus, Search, Upload, Download, ArrowUp, ArrowDown, Trash2, Filter, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { queryKeys } from '@/shared/lib/query-keys';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/components/pagination';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { useProducts } from '../hooks/use-products';
import { fetchCategories } from '@/features/categories/api/categories.api';
import { fetchBanners } from '@/features/banners/api/banners.api';
import { fetchFlashSales } from '@/features/flash-sale/api/flash-sale.api';
import { fetchSliders } from '@/features/sliders/api/sliders.api';
import { ProductsTable } from '../components/products-table';
import { ProductDetailDialog } from '../components/product-detail-dialog';
import { ProductImportDialog } from '../components/product-import-dialog';
import { ProductExportDialog } from '../components/product-export-dialog';
import { ProductDeleteAllDialog } from '../components/product-delete-all-dialog';
import { ProductBulkDeleteDialog } from '../components/product-bulk-delete-dialog';
import { productRoutes } from '../routes/product.routes';
import type { Product } from '../types/product.types';

interface ComboboxFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  items: Array<{ id: number; label: string; slug: string }>;
  isLoading: boolean;
  isFetchingMore?: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  allLabel: string;
}

function ComboboxFilter({
  open,
  onOpenChange,
  value,
  onValueChange,
  items,
  isLoading,
  isFetchingMore,
  search,
  onSearchChange,
  hasMore,
  onLoadMore,
  allLabel,
}: ComboboxFilterProps) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!hasMore || isFetchingMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      onLoadMore();
    }
  }, [hasMore, isFetchingMore, onLoadMore]);

  const selectedLabel = value === 'all'
    ? allLabel
    : items.find(i => i.slug === value)?.label ?? allLabel;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger render={<Button variant="outline" role="combobox" aria-expanded={open} className="w-full md:w-[200px] justify-between" />}>
        {selectedLabel}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-full md:w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('common.search')}
            value={search}
            onValueChange={onSearchChange}
          />
          <CommandList ref={listRef} onScroll={handleScroll}>
            <CommandEmpty>{t('common.noData')}</CommandEmpty>
            {isLoading && items.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
            ) : (
              <CommandGroup>
                <CommandItem value="all" onSelect={() => { onValueChange('all'); onOpenChange(false); }}>
                  {allLabel}
                </CommandItem>
                {items.map(item => (
                  <CommandItem key={item.id} value={item.slug} onSelect={() => { onValueChange(item.slug); onOpenChange(false); }}>
                    {item.label}
                  </CommandItem>
                ))}
                {isFetchingMore && (
                  <div className="py-2 text-center text-xs text-muted-foreground">{t('common.loading')}</div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderBy, setOrderBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailTarget, setDetailTarget] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [bannerFilter, setBannerFilter] = useState('all');
  const [flashSaleFilter, setFlashSaleFilter] = useState('all');
  const [sliderFilter, setSliderFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const dateRange = dateFrom && dateTo ? `${dateFrom}//${dateTo}` : undefined;

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [flashSaleOpen, setFlashSaleOpen] = useState(false);
  const [sliderOpen, setSliderOpen] = useState(false);

  const [catSearch, setCatSearch] = useState('');
  const [bannerSearch, setBannerSearch] = useState('');
  const [fsSearch, setFsSearch] = useState('');
  const [sliderSearch, setSliderSearch] = useState('');

  const catInf = useInfiniteQuery({
    queryKey: queryKeys.categories.filter(catSearch),
    queryFn: ({ pageParam }) => fetchCategories({ page: pageParam, perPage: 50, search: catSearch || undefined }),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.data) return undefined;
      return lastPage.data.current_page < lastPage.data.last_page ? lastPage.data.current_page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: categoryOpen,
  });
  const catItems = (catInf.data?.pages ?? []).flatMap(p => (p.data?.data ?? []).map(c => ({ id: c.id, label: c.name, slug: c.slug })));

  const bannerInf = useInfiniteQuery({
    queryKey: queryKeys.banners.list({ search: bannerSearch }),
    queryFn: ({ pageParam }) => fetchBanners({ page: pageParam, perPage: 50, search: bannerSearch || undefined }),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.data) return undefined;
      return lastPage.data.current_page < lastPage.data.last_page ? lastPage.data.current_page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: bannerOpen,
  });
  const bannerItems = (bannerInf.data?.pages ?? []).flatMap(p => (p.data?.data ?? []).map(b => ({ id: b.id, label: b.title, slug: b.slug ?? b.id.toString() })));

  const fsInf = useInfiniteQuery({
    queryKey: queryKeys.flashSales.filter(fsSearch),
    queryFn: ({ pageParam }) => fetchFlashSales({ page: pageParam, perPage: 50, search: fsSearch || undefined }),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.data) return undefined;
      return lastPage.data.current_page < lastPage.data.last_page ? lastPage.data.current_page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: flashSaleOpen,
  });
  const fsItems = (fsInf.data?.pages ?? []).flatMap(p => (p.data?.data ?? []).map(fs => ({ id: fs.id, label: fs.title, slug: fs.slug })));

  const sliderInf = useInfiniteQuery({
    queryKey: queryKeys.sliders.filter(sliderSearch),
    queryFn: ({ pageParam }) => fetchSliders({ page: pageParam, perPage: 50, search: sliderSearch || undefined }),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.data) return undefined;
      return lastPage.data.current_page < lastPage.data.last_page ? lastPage.data.current_page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: sliderOpen,
  });
  const sliderItems = (sliderInf.data?.pages ?? []).flatMap(p => (p.data?.data ?? []).map(s => ({ id: s.id, label: s.title, slug: s.slug })));

  const handleCatOpenChange = useCallback((open: boolean) => {
    setCategoryOpen(open);
    if (!open) setCatSearch('');
  }, []);
  const handleBannerOpenChange = useCallback((open: boolean) => {
    setBannerOpen(open);
    if (!open) setBannerSearch('');
  }, []);
  const handleFsOpenChange = useCallback((open: boolean) => {
    setFlashSaleOpen(open);
    if (!open) setFsSearch('');
  }, []);
  const handleSliderOpenChange = useCallback((open: boolean) => {
    setSliderOpen(open);
    if (!open) setSliderSearch('');
  }, []);

  const { data, isLoading, refetch } = useProducts({
    page,
    limit: 15,
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    orderBy: orderBy || undefined,
    orderDir: orderBy ? sortDir : undefined,
    date_range: dateRange,
    category: categoryFilter === 'all' ? undefined : categoryFilter || undefined,
    banner: bannerFilter === 'all' ? undefined : bannerFilter || undefined,
    flash_sale: flashSaleFilter === 'all' ? undefined : flashSaleFilter || undefined,
    slider: sliderFilter === 'all' ? undefined : sliderFilter || undefined,
  });

  const handleView = (product: Product) => {
    setDetailTarget(product);
  };

  const handleNavigateDetail = (product: Product) => {
    navigate(productRoutes.detail(product.id));
  };

  const handleNavigateEdit = (product: Product) => {
    navigate(productRoutes.edit(product.id));
  };

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setOrderBy('');
    setSortDir('desc');
    setDateFrom('');
    setDateTo('');
    setCategoryFilter('all');
    setBannerFilter('all');
    setFlashSaleFilter('all');
    setSliderFilter('all');
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'all' || orderBy || dateRange || categoryFilter !== 'all' || bannerFilter !== 'all' || flashSaleFilter !== 'all' || sliderFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('products.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('products.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t('products.importBtn')}
          </Button>
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            {t('products.exportBtn')}
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteAllOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('products.deleteAllBtn')}
          </Button>
          <Button onClick={() => navigate(productRoutes.create)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('products.addProduct')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('products.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="ps-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value ?? 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder={t('products.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.allStatuses')}</SelectItem>
            <SelectItem value="1">{t('products.active')}</SelectItem>
            <SelectItem value="0">{t('products.inactive')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={orderBy}
          onValueChange={(value) => {
            setOrderBy(value ?? '');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder={t('products.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('products.sortByDefault')}</SelectItem>
            <SelectItem value="name">{t('products.name')}</SelectItem>
            <SelectItem value="price">{t('products.price')}</SelectItem>
            <SelectItem value="created_at">{t('products.date')}</SelectItem>
            <SelectItem value="stock_quantity">{t('products.stock')}</SelectItem>
            <SelectItem value="status">{t('products.status')}</SelectItem>
          </SelectContent>
        </Select>

        {orderBy && (
          <Button variant="outline" size="icon-sm" onClick={toggleSortDir} title={sortDir === 'asc' ? t('products.sortAsc') : t('products.sortDesc')}>
            {sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-[150px]"
            placeholder={t('products.dateFrom')}
          />
          <span className="text-muted-foreground text-sm">{t('common.to')}</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-[150px]"
            placeholder={t('products.dateTo')}
          />
        </div>

        <Button
          variant={showAdvancedFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowAdvancedFilters((v) => !v)}
        >
          <Filter className="mr-1.5 h-4 w-4" />
          {t('products.filters')}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            {t('common.clear')}
          </Button>
        )}
      </div>

      {showAdvancedFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <ComboboxFilter
            open={categoryOpen}
            onOpenChange={handleCatOpenChange}
            value={categoryFilter}
            onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}
            items={catItems}
            isLoading={catInf.isLoading}
            isFetchingMore={catInf.isFetchingNextPage}
            search={catSearch}
            onSearchChange={setCatSearch}
            hasMore={catInf.hasNextPage}
            onLoadMore={() => catInf.fetchNextPage()}
            allLabel={t('products.allCategories')}
          />
          <ComboboxFilter
            open={bannerOpen}
            onOpenChange={handleBannerOpenChange}
            value={bannerFilter}
            onValueChange={(v) => { setBannerFilter(v); setPage(1); }}
            items={bannerItems}
            isLoading={bannerInf.isLoading}
            isFetchingMore={bannerInf.isFetchingNextPage}
            search={bannerSearch}
            onSearchChange={setBannerSearch}
            hasMore={bannerInf.hasNextPage}
            onLoadMore={() => bannerInf.fetchNextPage()}
            allLabel={t('products.allBanners')}
          />
          <ComboboxFilter
            open={flashSaleOpen}
            onOpenChange={handleFsOpenChange}
            value={flashSaleFilter}
            onValueChange={(v) => { setFlashSaleFilter(v); setPage(1); }}
            items={fsItems}
            isLoading={fsInf.isLoading}
            isFetchingMore={fsInf.isFetchingNextPage}
            search={fsSearch}
            onSearchChange={setFsSearch}
            hasMore={fsInf.hasNextPage}
            onLoadMore={() => fsInf.fetchNextPage()}
            allLabel={t('products.allFlashSales')}
          />
          <ComboboxFilter
            open={sliderOpen}
            onOpenChange={handleSliderOpenChange}
            value={sliderFilter}
            onValueChange={(v) => { setSliderFilter(v); setPage(1); }}
            items={sliderItems}
            isLoading={sliderInf.isLoading}
            isFetchingMore={sliderInf.isFetchingNextPage}
            search={sliderSearch}
            onSearchChange={setSliderSearch}
            hasMore={sliderInf.hasNextPage}
            onLoadMore={() => sliderInf.fetchNextPage()}
            allLabel={t('products.allSliders')}
          />
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2.5">
          <p className="text-sm text-muted-foreground">
            {t('products.nSelected', { count: selectedIds.length })}
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            {t('products.deleteSelected')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds([])}
          >
            {t('common.clear')}
          </Button>
        </div>
      )}

      <ProductsTable
        data={data?.data?.data || []}
        isLoading={isLoading}
        onView={handleView}
        onNavigateDetail={handleNavigateDetail}
        onEdit={handleNavigateEdit}
        onRefresh={refetch}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <Pagination
        page={page}
        lastPage={data?.data?.links?.last_page ?? 1}
        total={data?.data?.links?.total ?? 0}
        from={data?.data?.links?.from ?? 0}
        to={data?.data?.links?.to ?? 0}
        perPage={data?.data?.links?.per_page ?? 15}
        onPageChange={setPage}
        className="py-2"
      />

      {detailTarget && (
        <ProductDetailDialog
          product={detailTarget}
          open={!!detailTarget}
          onOpenChange={(open) => {
            if (!open) setDetailTarget(null);
          }}
        />
      )}

      <ProductImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      <ProductExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
      />

      <ProductDeleteAllDialog
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
      />

      <ProductBulkDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        selectedIds={selectedIds}
        onDeleted={() => setSelectedIds([])}
      />

    </div>
  );
}
