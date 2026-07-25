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

  const { data, isLoading, refetch } = usePromotions(params);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('promotions.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('promotions.subtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('promotions.addPromotion')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('promotions.searchPlaceholder')}
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

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v ?? 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-full md:w-[140px]">
            <SelectValue placeholder={t('promotions.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('promotions.allTypes')}</SelectItem>
            <SelectItem value="price">{t('promotionsForm.priceDiscount')}</SelectItem>
            <SelectItem value="quantity">{t('promotionsForm.quantityPromotion')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeAmountFilter}
          onValueChange={(v) => {
            setTypeAmountFilter(v ?? 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-full md:w-[140px]">
            <SelectValue placeholder={t('promotions.discountType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('promotions.allDiscountTypes')}</SelectItem>
            <SelectItem value="fixed_rate">{t('promotionsForm.fixedRate')}</SelectItem>
            <SelectItem value="percentage">{t('promotionsForm.percentage')}</SelectItem>
            <SelectItem value="gift">{t('promotionsForm.gift')}</SelectItem>
          </SelectContent>
        </Select>

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
