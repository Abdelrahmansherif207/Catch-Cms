import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
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
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { useProducts } from '@/features/products/hooks/use-products';
import { useReviews } from '../hooks/use-reviews';
import { ReviewsTable } from '../components/reviews-table';
import type { Product } from '@/features/products/types/product.types';

export function ReviewsPage() {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);

  const { data: productsData, isLoading: productsLoading } = useProducts({
    search: productSearch || undefined,
    limit: 20,
  });

  const { data: reviewsData, isLoading: reviewsLoading, isError: reviewsError, refetch } = useReviews({
    product_id: selectedProduct?.id ?? 0,
  });

  const products = productsData?.data?.data || [];
  const allReviews = reviewsData?.data || [];
  const filteredReviews = statusFilter === 'all'
    ? allReviews
    : allReviews.filter((r) =>
        statusFilter === 'approved' ? r.is_approved : !r.is_approved
      );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('reviews.pageTitle')}
        description={t('reviews.pageDescription')}
      />

      <FilterBar activeCount={(selectedProduct ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}>
        <div className="flex w-full flex-wrap items-center gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('reviews.selectProduct')}</label>
          <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
            <PopoverTrigger render={<Button variant="outline" className="w-[280px] justify-start text-start font-normal" />}>
              {selectedProduct ? (
                <span className="truncate">{selectedProduct.name}</span>
              ) : (
                <span className="text-muted-foreground">{t('reviews.searchProduct')}</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder={t('reviews.searchProduct')}
                  value={productSearch}
                  onValueChange={setProductSearch}
                />
                <CommandList>
                  {productsLoading ? (
                    <CommandEmpty>{t('common.loading')}</CommandEmpty>
                  ) : products.length === 0 ? (
                    <CommandEmpty>{t('common.noData')}</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {products.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.id.toString()}
                          onSelect={() => {
                            setSelectedProduct(p);
                            setProductPopoverOpen(false);
                          }}
                        >
                          <span className="truncate">{p.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <FilterSelect
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
          prefix={t('reviews.status')}
          allLabel={t('reviews.allStatuses')}
          options={[
            { value: 'approved', label: t('reviews.approved') },
            { value: 'pending', label: t('reviews.pending') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
      </div>
      </FilterBar>

      {selectedProduct ? (
        <>
          {reviewsError && (
            <DataErrorState
              message={t('reviews.listError')}
              onRetry={() => refetch()}
            />
          )}
          <ReviewsTable
            data={filteredReviews}
            isLoading={reviewsLoading}
            onRefresh={refetch}
          />
        </>
      ) : (
        <div className="rounded-lg border">
          <div className="flex h-48 items-center justify-center">
            <p className="text-muted-foreground">{t('reviews.selectProductPrompt')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
