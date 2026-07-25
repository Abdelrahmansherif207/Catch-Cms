import { useState, useCallback } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Pagination } from '@/shared/components/pagination';
import { CouponsTable } from '../components/coupons-table';
import { CouponFormDialog } from '../components/coupon-form-dialog';
import { useCoupons } from '../hooks/use-coupons';
import type { Coupon } from '../types/coupon.types';

export function CouponsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [order, setOrder] = useState('created_at');
  const [sortedBy, setSortedBy] = useState('desc');
  const [openForm, setOpenForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const params = {
    page,
    perPage,
    search: search || undefined,
    active: activeFilter === 'active' ? true : undefined,
    inactive: activeFilter === 'inactive' ? true : undefined,
    order: order || undefined,
    sortedBy: sortedBy || undefined,
  };

  const { data, isLoading, refetch } = useCoupons(params);

  const coupons = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;

  const handleEdit = useCallback((coupon: Coupon) => {
    setEditingCoupon(coupon);
    setOpenForm(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingCoupon(null);
    setOpenForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setOpenForm(false);
    setEditingCoupon(null);
    refetch();
  }, [refetch]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t('coupons.pageTitle')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="me-1.5 h-4 w-4" />
            {t('common.create')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleSearch}
            aria-label={t('common.search')}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Input
            placeholder={t('coupons.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="h-8 ps-9"
          />
        </div>
        <Select value={activeFilter} onValueChange={(v) => { if (v) setActiveFilter(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-full md:w-[130px]">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('coupons.allStatuses')}</SelectItem>
            <SelectItem value="active">{t('coupons.active')}</SelectItem>
            <SelectItem value="inactive">{t('coupons.inactive')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={order} onValueChange={(v) => { if (v) setOrder(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-full md:w-[150px]">
            <SelectValue placeholder={t('coupons.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">{t('coupons.sortCreatedAt')}</SelectItem>
            <SelectItem value="discount">{t('coupons.sortDiscount')}</SelectItem>
            <SelectItem value="start_date">{t('coupons.sortStartDate')}</SelectItem>
            <SelectItem value="end_date">{t('coupons.sortEndDate')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortedBy} onValueChange={(v) => { if (v) setSortedBy(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-full md:w-[120px]">
            <SelectValue placeholder={t('coupons.sortedBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{t('coupons.asc')}</SelectItem>
            <SelectItem value="desc">{t('coupons.desc')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(perPage)} onValueChange={(v) => { if (v) setPerPage(Number(v)); setPage(1); }}>
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

      <CouponsTable
        data={coupons}
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

      <CouponFormDialog
        coupon={editingCoupon}
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
