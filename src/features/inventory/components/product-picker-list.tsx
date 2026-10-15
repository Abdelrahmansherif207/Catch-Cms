import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { Pagination } from '@/shared/components/pagination';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  useReceivableProductsPage,
  usePickerCategories,
} from '../hooks/use-inventory';
import { isReceivableProduct, type PickerVariant } from '../types/inventory.types';
import type { Product } from '@/features/products/types/product.types';

interface ProductPickerListProps {
  selectedId: number | null;
  onSelect: (productId: number, name: string, variants: PickerVariant[]) => void;
}

/**
 * Step 1 of both stock modals: a filtered, paged slice of the REAL admin
 * products index (search + status + category + sort + direction), from which
 * the operator selects EXACTLY ONE product. Rows the backend would always
 * refuse (digital, variable parents without SKUs) never appear — variant
 * products STAY (the modals then require a variant pick, per the receipts/
 * transfers `product_variant_id` contract).
 */
export function ProductPickerList({ selectedId, onSelect }: ProductPickerListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [orderBy, setOrderBy] = useState('');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  const query = useReceivableProductsPage({
    page,
    search: search || undefined,
    status: status === 'all' ? undefined : status,
    category: category === 'all' ? undefined : category,
    orderBy: orderBy || undefined,
    orderDir,
  });

  const rows = (query.data?.data.data ?? []).filter(isReceivableProduct);
  const links = query.data?.data.links;

  const categoriesQuery = usePickerCategories();
  const categoryOptions = (categoriesQuery.data ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }));

  const stockOf = (product: Product) =>
    product.stock_quantity ?? product.quantity ?? 0;

  return (
    <div className="space-y-3">
      <FilterBar
        activeCount={
          (search ? 1 : 0) +
          (status !== 'all' ? 1 : 0) +
          (category !== 'all' ? 1 : 0) +
          (orderBy ? 1 : 0)
        }
      >
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            resetPage();
          }}
          placeholder={t('products.searchPlaceholder')}
          className="md:w-56"
        />

        <FilterSelect
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            resetPage();
          }}
          prefix={t('products.status')}
          allLabel={t('products.allStatuses')}
          options={[
            { value: '1', label: t('products.active') },
            { value: '0', label: t('products.inactive') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[170px]"
        />

        <FilterSelect
          value={category}
          onValueChange={(value) => {
            setCategory(value);
            resetPage();
          }}
          prefix={t('products.categories')}
          allLabel={t('products.allCategories')}
          options={categoryOptions}
          triggerClassName="w-full md:w-auto md:min-w-[170px]"
        />

        <FilterSelect
          value={orderBy}
          onValueChange={(value) => {
            setOrderBy(value);
            resetPage();
          }}
          prefix={t('products.sortBy')}
          allLabel={t('products.sortByDefault')}
          allValue=""
          options={[
            { value: 'name', label: t('products.name') },
            { value: 'stock_quantity', label: t('products.stock') },
            { value: 'created_at', label: t('products.date') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[170px]"
        />

        {orderBy && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setOrderDir(orderDir === 'asc' ? 'desc' : 'asc')}
            title={orderDir === 'asc' ? t('products.sortAsc') : t('products.sortDesc')}
          >
            {orderDir === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </FilterBar>

      <div className="max-h-[320px] overflow-y-auto rounded-xl border">
        {query.isError && (
          <div className="p-4">
            <DataErrorState
              message={query.error?.message}
              onRetry={() => query.refetch()}
            />
          </div>
        )}

        {query.isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-3">
              <span className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <span className="h-4 w-1/6 animate-pulse rounded bg-muted" />
            </div>
          ))}

        {!query.isLoading &&
          !query.isError &&
          rows.length === 0 &&
          search.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('common.noData')}
            </p>
          )}

        {rows.map((product: Product) => (
          <button
            key={product.id}
            type="button"
            onClick={() =>
              onSelect(product.id, product.name, product.variants ?? [])
            }
            className={cn(
              'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start transition-colors hover:bg-accent',
              product.id === selectedId && 'bg-accent'
            )}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {product.name}
              </span>
              {product.sku && (
                <span className="block truncate text-xs text-muted-foreground">
                  {product.sku}
                </span>
              )}
            </span>
            <span className="shrink-0 text-end">
              <span className="block text-sm font-semibold tabular-nums text-foreground">
                {stockOf(product)}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t('products.stock')}
              </span>
            </span>
          </button>
        ))}
      </div>

      {links && (
        <Pagination
          page={links.current_page}
          lastPage={links.last_page}
          total={links.total}
          from={links.from ?? 0}
          to={links.to ?? 0}
          perPage={links.per_page}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
