import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackageSearch, SearchX } from 'lucide-react';
import { CardSection } from '@/shared/components/card-section';
import { DataErrorState } from '@/shared/components/data-state';
import { SearchInput } from '@/shared/components/search-input';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import { formatUnits, type ContentsIndex } from '../lib/contents';

/** Product chosen as the map focus (equals the old locator payload). */
export interface LocatedProduct {
  id: number;
  name: string;
}

interface ProductsSidebarProps {
  index: ContentsIndex | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  /** True when the bins list is server-truncated → contents cover shown bins only. */
  truncated: boolean;
  selected: LocatedProduct | null;
  onSelect: (product: LocatedProduct | null) => void;
}

function nameOrder(a: { name: string }, b: { name: string }): number {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

/**
 * Searchable list of every product currently on the map, aggregated from
 * the check-occupancy response — clicking a row spotlights its bins with
 * zero extra requests.
 */
export function ProductsSidebar({
  index,
  loading,
  error,
  onRetry,
  truncated,
  selected,
  onSelect,
}: ProductsSidebarProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const products = useMemo(() => {
    if (!index) return [];
    const query = search.trim().toLowerCase();
    return [...index.byProduct.values()]
      .filter((product) => {
        if (!query) return true;
        return (
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => nameOrder(a, b) || a.productId - b.productId);
  }, [index, search]);

  const pick = (productId: number, name: string) => {
    if (selected?.id === productId) onSelect(null);
    else onSelect({ id: productId, name });
  };

  return (
    <CardSection title={t('warehouseMap.productsSidebar')} icon={PackageSearch}>
      {truncated && (
        <p className="mb-2 text-xs text-muted-foreground">
          {t('warehouseMap.sidebarScopeNote')}
        </p>
      )}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('warehouseMap.productsSearch')}
        className="w-full"
        autoFocus={false}
      />

      <div className="mt-3 max-h-[280px] space-y-1.5 overflow-y-auto pe-1">
        {error ? (
          <DataErrorState message={t('warehouseMap.contentsFailed')} onRetry={onRetry} />
        ) : loading && products.length === 0 ? (
          <>
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-4/5 rounded-xl" />
          </>
        ) : products.length === 0 ? (
          <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <SearchX className="h-4 w-4 shrink-0" aria-hidden />
            {index && index.byProduct.size > 0
              ? t('warehouseMap.productsNoMatch')
              : t('warehouseMap.productsEmpty')}
          </p>
        ) : (
          products.map((product) => {
            const isSelected = selected?.id === product.productId;
            return (
              <button
                key={product.productId}
                type="button"
                onClick={() => pick(product.productId, product.name)}
                className={cn(
                  'flex w-full items-baseline justify-between gap-2 rounded-xl border px-2.5 py-2 text-start transition-colors hover:bg-primary/5',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'bg-card text-foreground'
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium" title={product.name}>
                    {product.name}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
                    {product.sku}
                  </span>
                </span>
                <span className="shrink-0 text-end text-xs text-muted-foreground">
                  <span className="block font-semibold text-primary">
                    ×{formatUnits(product.totalQuantity)}
                  </span>
                  <span className="block">
                    {t('warehouseMap.binsCount', { count: product.binsCount })}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </CardSection>
  );
}
