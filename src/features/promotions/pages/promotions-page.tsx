import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { usePromotions } from '../hooks/use-promotions';
import { PromotionsTable } from '../components/promotions-table';
import { PromotionFormDialog } from '../components/promotion-form-dialog';
import type { Promotion } from '../types/promotion.types';

export function PromotionsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [typeAmountFilter, setTypeAmountFilter] = useState<string>('all');
  const [orderBy, setOrderBy] = useState('id');
  const [sort, setSort] = useState('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const params = {
    page,
    limit,
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    typeAmount: typeAmountFilter === 'all' ? undefined : typeAmountFilter,
    orderBy: orderBy || undefined,
    sort: sort || undefined,
  };

  const { data, isLoading, isError, refetch } = usePromotions(params);

  const promotions = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;
  const lastPage = data?.data?.last_page ?? 1;

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingPromotion(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingPromotion(null);
    refetch();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('promotions.title')}
        description={t('promotions.subtitle')}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="me-2 h-4 w-4" />
            {t('promotions.addPromotion')}
          </Button>
        }
      />

      <FilterBar
        activeCount={
          [search].filter(Boolean).length +
          [typeFilter, typeAmountFilter].filter((v) => v !== 'all').length
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('promotions.searchPlaceholder')}
          />

          {search && (
            <Button variant="ghost" size="sm" onClick={handleClearSearch}>
              {t('common.clear')}
            </Button>
          )}

          <FilterSelect
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
            prefix={t('promotions.type')}
            allLabel={t('promotions.allTypes')}
            options={[
              { value: 'price', label: t('promotionsForm.priceDiscount') },
              { value: 'quantity', label: t('promotionsForm.quantityPromotion') },
            ]}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />

          <FilterSelect
            value={typeAmountFilter}
            onValueChange={(v) => {
              setTypeAmountFilter(v);
              setPage(1);
            }}
            prefix={t('promotions.discountType')}
            allLabel={t('promotions.allDiscountTypes')}
            options={[
              { value: 'fixed_rate', label: t('promotionsForm.fixedRate') },
              { value: 'percentage', label: t('promotionsForm.percentage') },
              { value: 'gift', label: t('promotionsForm.gift') },
            ]}
            triggerClassName="w-full md:w-auto md:min-w-[200px]"
          />

          <Select
            value={orderBy}
            onValueChange={(v) => {
              setOrderBy(v ?? 'created_at');
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-full md:w-[150px]">
              <SelectValue placeholder={t('promotions.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">{t('promotions.sortCreatedAt')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v ?? 'asc');
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-full md:w-[120px]">
              <SelectValue placeholder={t('promotions.sortedBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">{t('promotions.asc')}</SelectItem>
              <SelectItem value="desc">{t('promotions.desc')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(limit)}
            onValueChange={(v) => {
              setLimit(Number(v));
              setPage(1);
            }}
          >
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

      <PromotionsTable
        data={promotions}
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
        perPage={limit}
        onPageChange={setPage}
      />

      <PromotionFormDialog
        promotion={editingPromotion}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
