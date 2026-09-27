import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
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
import { CouponsTable } from '../components/coupons-table';
import { CouponFormDialog } from '../components/coupon-form-dialog';
import { TargetingFormDialog } from '../components/targeting-form-dialog';
import { AddAssignmentDialog } from '../components/add-assignment-dialog';
import { usePermissions } from '@/shared/auth/guards';
import { COUPON_PERMISSIONS } from '../permissions/coupon.permissions';
import { useCoupons } from '../hooks/use-coupons';
import type { Coupon, CouponAudienceType, TargetingMode } from '../types/coupon.types';

export function CouponsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [order, setOrder] = useState('');
  const [sortedBy, setSortedBy] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [targetingFilter, setTargetingFilter] = useState('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [validFilter, setValidFilter] = useState('all');
  const [enabledFilter, setEnabledFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [limiterInput, setLimiterInput] = useState('');
  const [usedInput, setUsedInput] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [targetingCoupon, setTargetingCoupon] = useState<Coupon | null>(null);
  const [assignCoupon, setAssignCoupon] = useState<Coupon | null>(null);

  const { canAny, isSuperAdmin } = usePermissions();
  const canManageTargeting = canAny([COUPON_PERMISSIONS.UPDATE, COUPON_PERMISSIONS.CREATE]);

  const params = {
    page,
    perPage,
    search: search || undefined,
    active: activeFilter === 'active' ? true : undefined,
    inactive: activeFilter === 'inactive' ? true : undefined,
    audienceType: audienceFilter === 'all' ? undefined : (audienceFilter as CouponAudienceType),
    targetingMode: targetingFilter === 'all' ? undefined : (targetingFilter as TargetingMode),
    discountType: discountTypeFilter === 'all' ? undefined : discountTypeFilter,
    isAssigned: assignedFilter === 'all' ? undefined : assignedFilter === 'yes',
    isValid: validFilter === 'all' ? undefined : validFilter === 'yes',
    status: enabledFilter === 'all' ? undefined : enabledFilter === 'yes',
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    discount: discountInput || undefined,
    limiter: limiterInput === '' ? undefined : Number(limiterInput),
    used: usedInput === '' ? undefined : Number(usedInput),
    // No ordering on initial load — pagination only (?page=1&limit=15).
    // order/sortedBy are sent only after the user explicitly picks them.
    order: order || undefined,
    sortedBy: order && sortedBy ? sortedBy : undefined,
  };

  const { data, isLoading, isError, refetch } = useCoupons(params);

  const coupons = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;

  const handleEdit = useCallback((coupon: Coupon) => {
    navigate('/coupons/' + coupon.id + '/edit');
  }, [navigate]);

  const handleTargeting = useCallback((coupon: Coupon) => {
    setTargetingCoupon(coupon);
  }, []);

  const handleAssign = useCallback((coupon: Coupon) => {
    setAssignCoupon(coupon);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingCoupon(null);
    setOpenForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setOpenForm(false);
    setEditingCoupon(null);
    setPage(1);
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('coupons.pageTitle')}
        description={t('coupons.subtitle')}
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
          [search, startDate, endDate, discountInput, limiterInput, usedInput]
            .filter(Boolean).length +
          [activeFilter, audienceFilter, targetingFilter, discountTypeFilter, assignedFilter, validFilter, enabledFilter]
            .filter((v) => v !== 'all').length +
          [order, sortedBy].filter((v) => v !== '').length
        }
      >
        <div className="flex w-full flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={t('coupons.searchPlaceholder')}
        />
        <FilterSelect
          value={activeFilter}
          onValueChange={(v) => {
            setActiveFilter(v);
            setPage(1);
          }}
          prefix={t('common.status')}
          allLabel={t('coupons.allStatuses')}
          options={[
            { value: 'active', label: t('coupons.active') },
            { value: 'inactive', label: t('coupons.inactive') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
        <FilterSelect
          value={audienceFilter}
          onValueChange={(v) => {
            setAudienceFilter(v);
            setPage(1);
          }}
          prefix={t('coupons.filterAudience')}
          allLabel={t('coupons.allAudiences')}
          options={[
            { value: 'PUBLIC', label: t('coupons.audiencePublic') },
            { value: 'TARGETED', label: t('coupons.audienceTargeted') },
            { value: 'ASSIGNED', label: t('coupons.audienceAssigned') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
        <FilterSelect
          value={targetingFilter}
          onValueChange={(v) => {
            setTargetingFilter(v);
            setPage(1);
          }}
          prefix={t('coupons.filterTargeting')}
          allLabel={t('coupons.allTargeting')}
          options={[{ value: 'dynamic', label: t('coupons.targetingDynamic') }]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
        <FilterSelect
          value={discountTypeFilter}
          onValueChange={(v) => {
            setDiscountTypeFilter(v);
            setPage(1);
          }}
          prefix={t('coupons.filterDiscountType')}
          allLabel={t('coupons.allDiscountTypes')}
          options={[
            { value: 'percentage', label: t('coupons.dtPercentage') },
            { value: 'fixed_rate', label: t('coupons.dtFixed') },
            { value: 'free_shipping', label: t('coupons.dtFreeShipping') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
        <FilterSelect
          value={assignedFilter}
          onValueChange={(v) => {
            setAssignedFilter(v);
            setPage(1);
          }}
          prefix={t('coupons.filterAssigned')}
          allLabel={t('coupons.allAssigned')}
          options={[
            { value: 'yes', label: t('coupons.assignedYes') },
            { value: 'no', label: t('coupons.assignedNo') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
        <FilterSelect
          value={validFilter}
          onValueChange={(v) => {
            setValidFilter(v);
            setPage(1);
          }}
          prefix={t('coupons.filterValid')}
          allLabel={t('coupons.allValidity')}
          options={[
            { value: 'yes', label: t('coupons.valid') },
            { value: 'no', label: t('coupons.invalid') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
        <FilterSelect
          value={enabledFilter}
          onValueChange={(v) => {
            setEnabledFilter(v);
            setPage(1);
          }}
          prefix={t('coupons.filterEnabled')}
          allLabel={t('coupons.allEnabled')}
          options={[
            { value: 'yes', label: t('coupons.enabledYes') },
            { value: 'no', label: t('coupons.enabledNo') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          aria-label={t('coupons.filterStartDate')}
          className="h-8 w-full md:w-[150px]"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          aria-label={t('coupons.filterEndDate')}
          className="h-8 w-full md:w-[150px]"
        />
        <Input
          type="number"
          min={0}
          value={discountInput}
          onChange={(e) => {
            setDiscountInput(e.target.value);
            setPage(1);
          }}
          placeholder={t('coupons.filterDiscount')}
          aria-label={t('coupons.filterDiscount')}
          className="h-8 w-full md:w-[110px]"
        />
        <Input
          type="number"
          min={0}
          value={limiterInput}
          onChange={(e) => {
            setLimiterInput(e.target.value);
            setPage(1);
          }}
          placeholder={t('coupons.filterLimiter')}
          aria-label={t('coupons.filterLimiter')}
          className="h-8 w-full md:w-[110px]"
        />
        <Input
          type="number"
          min={0}
          value={usedInput}
          onChange={(e) => {
            setUsedInput(e.target.value);
            setPage(1);
          }}
          placeholder={t('coupons.filterUsed')}
          aria-label={t('coupons.filterUsed')}
          className="h-8 w-full md:w-[110px]"
        />
        <FilterSelect
          value={order}
          onValueChange={(v) => {
            setOrder(v);
            setPage(1);
          }}
          prefix={t('coupons.sortBy')}
          allLabel={t('coupons.sortByDefault')}
          allValue=""
          options={[
            { value: 'created_at', label: t('coupons.sortCreatedAt') },
            { value: 'discount', label: t('coupons.sortDiscount') },
            { value: 'start_date', label: t('coupons.sortStartDate') },
            { value: 'end_date', label: t('coupons.sortEndDate') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
        <FilterSelect
          value={sortedBy}
          onValueChange={(v) => {
            setSortedBy(v);
            setPage(1);
          }}
          prefix={t('coupons.sortedBy')}
          allLabel={t('coupons.sortByDefault')}
          allValue=""
          options={[
            { value: 'asc', label: t('coupons.asc') },
            { value: 'desc', label: t('coupons.desc') },
          ]}
          triggerClassName="w-full md:w-auto md:min-w-[190px]"
        />
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
      </FilterBar>

      {isError && (
        <DataErrorState
          message={t('coupons.listError')}
          onRetry={() => refetch()}
        />
      )}

      <CouponsTable
        data={coupons}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefresh={() => refetch()}
        onTargeting={canManageTargeting ? handleTargeting : undefined}
        onAssign={isSuperAdmin ? handleAssign : undefined}
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

      {targetingCoupon && (
        <TargetingFormDialog
          couponId={targetingCoupon.id}
          open
          onOpenChange={(open) => {
            if (!open) setTargetingCoupon(null);
          }}
        />
      )}

      {assignCoupon && (
        <AddAssignmentDialog
          couponId={assignCoupon.id}
          open
          onOpenChange={(open) => {
            if (!open) setAssignCoupon(null);
          }}
          onSuccess={() => setAssignCoupon(null)}
        />
      )}
    </div>
  );
}
