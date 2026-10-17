import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { OrdersTable } from '../components/orders-table';
import { useTrackingOrders } from '@/features/tracking/hooks/use-tracking';
import { TRACKING_PAYMENT_STATUSES } from '@/features/tracking/utils/order-colors';
import type { TrackingOrderRow, TrackingSortColumn } from '@/features/tracking/types/tracking.types';

const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled', 'delivered'] as const;
const FULFILLMENT_STATUSES = [
  'pending',
  'processing',
  'picking',
  'packing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
] as const;
const SORT_COLUMNS: TrackingSortColumn[] = ['created_at', 'updated_at', 'total_price', 'status', 'id'];
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

interface QuickRangePreset {
  value: string;
  newer_than?: string;
  older_than?: string;
}

/** Values for the backend relative-duration parser ('1d', '7d', '30d', '90d'). */
const QUICK_RANGES: QuickRangePreset[] = [
  { value: '24h', newer_than: '1d' },
  { value: '7d', newer_than: '7d' },
  { value: '30d', newer_than: '30d' },
  { value: 'older_30d', older_than: '30d' },
  { value: 'older_90d', older_than: '90d' },
];

const DEFAULT_PER_PAGE = 50;

const isStatus = (v: string | null): boolean =>
  (ORDER_STATUSES as readonly string[]).includes(v ?? '');
const isPayment = (v: string | null): boolean =>
  (TRACKING_PAYMENT_STATUSES as readonly string[]).includes(v ?? '');
const isFulfillment = (v: string | null): boolean =>
  (FULFILLMENT_STATUSES as readonly string[]).includes(v ?? '');

export function OrdersPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // Deep-link seeds (attention alerts link here with ?payment_status=... etc.)
  const seededPayment = isPayment(searchParams.get('payment_status'))
    ? searchParams.get('payment_status')!
    : 'all';
  const seededStatus = isStatus(searchParams.get('status')) ? searchParams.get('status')! : 'all';
  const seededFulfillment = isFulfillment(searchParams.get('fulfillment_status'))
    ? searchParams.get('fulfillment_status')!
    : 'all';
  const seedSearch = searchParams.get('search') ?? '';

  const [search, setSearch] = useState(seedSearch);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(seededStatus);
  const [paymentStatus, setPaymentStatus] = useState(seededPayment);
  const [fulfillmentStatus, setFulfillmentStatus] = useState(seededFulfillment);
  const [quickRange, setQuickRange] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<TrackingSortColumn>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const activeRange = QUICK_RANGES.find((r) => r.value === quickRange);

  const { data, isLoading, isError, refetch, isFetching } = useTrackingOrders({
    page,
    status: status === 'all' ? undefined : status,
    payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
    fulfillment_status: fulfillmentStatus === 'all' ? undefined : fulfillmentStatus,
    search: search || undefined,
    newer_than: activeRange?.newer_than,
    older_than: activeRange?.older_than,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    per_page: perPage,
  });

  const pageData = data?.data;

  const hasActiveFilters =
    search ||
    status !== 'all' ||
    paymentStatus !== 'all' ||
    fulfillmentStatus !== 'all' ||
    quickRange !== '' ||
    dateFrom ||
    dateTo ||
    sortBy !== 'created_at' ||
    sortOrder !== 'desc' ||
    perPage !== DEFAULT_PER_PAGE;

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setPaymentStatus('all');
    setFulfillmentStatus('all');
    setQuickRange('');
    setDateFrom('');
    setDateTo('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPerPage(DEFAULT_PER_PAGE);
    setPage(1);
  };

  const changePerPage = (value: string) => {
    // Server clamps 1–100; the whitelist keeps the picker meaningful.
    setPerPage(PER_PAGE_OPTIONS.includes(Number(value)) ? Number(value) : DEFAULT_PER_PAGE);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('orders.title')}
        description={t('orders.subtitle')}
        actions={
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      <FilterBar
        activeCount={
          [search, dateFrom, dateTo].filter(Boolean).length +
          [status, paymentStatus, fulfillmentStatus].filter((v) => v !== 'all').length +
          (quickRange !== '' ? 1 : 0)
        }
      >
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('orders.searchPlaceholder')}
          />

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              prefix={t('orders.status')}
              allLabel={t('orders.allStatuses')}
              options={ORDER_STATUSES.map((s) => ({
                value: s,
                label: t(`orders.statuses.${s}`, { defaultValue: s }),
              }))}
              triggerClassName="w-full md:w-auto md:min-w-[190px]"
            />

            <FilterSelect
              value={paymentStatus}
              onValueChange={(value) => {
                setPaymentStatus(value);
                setPage(1);
              }}
              prefix={t('orders.paymentStatus')}
              allLabel={t('orders.allPaymentStatuses')}
              options={TRACKING_PAYMENT_STATUSES.map((s) => ({
                value: s,
                label: t(`orders.paymentStatuses.${s}`, { defaultValue: s }),
              }))}
              triggerClassName="w-full md:w-auto md:min-w-[200px]"
            />

            <FilterSelect
              value={fulfillmentStatus}
              onValueChange={(value) => {
                setFulfillmentStatus(value);
                setPage(1);
              }}
              prefix={t('orders.fulfillment')}
              allLabel={t('orders.allFulfillments')}
              options={FULFILLMENT_STATUSES.map((s) => ({
                value: s,
                label: t(`orders.fulfillmentStatuses.${s}`, { defaultValue: s }),
              }))}
              triggerClassName="w-full md:w-auto md:min-w-[190px]"
            />

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                {t('common.clear')}
              </Button>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <FilterSelect
            value={quickRange}
            onValueChange={(value) => {
              setQuickRange(value);
              setDateFrom('');
              setDateTo('');
              setPage(1);
            }}
            prefix={t('orders.list.quickRange')}
            allLabel={t('orders.list.allTime')}
            allValue=""
            options={QUICK_RANGES.map((r) => ({
              value: r.value,
              label: t(`orders.list.quickRanges.${r.value}`),
            }))}
            triggerClassName="w-full md:w-auto md:min-w-[180px]"
          />
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {t('orders.dateFrom')}
            </span>
            <Input
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setQuickRange('');
                setPage(1);
              }}
              className="h-9 w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {t('orders.dateTo')}
            </span>
            <Input
              type="datetime-local"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setQuickRange('');
                setPage(1);
              }}
              className="h-9 w-auto"
            />
          </div>
          <FilterSelect
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(SORT_COLUMNS.includes(value as TrackingSortColumn)
                ? (value as TrackingSortColumn)
                : 'created_at');
              setPage(1);
            }}
            prefix={t('orders.list.sortBy')}
            allLabel={t('orders.list.sortColumns.created_at')}
            allValue="created_at"
            options={SORT_COLUMNS.map((column) => ({
              value: column,
              label: t(`orders.list.sortColumns.${column}`),
            }))}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
          <FilterSelect
            value={sortOrder}
            onValueChange={(value) => {
              setSortOrder(value === 'asc' ? 'asc' : 'desc');
              setPage(1);
            }}
            prefix={t('orders.list.sortOrder')}
            allLabel={t('orders.list.sortDirections.desc')}
            allValue="desc"
            options={[
              { value: 'desc', label: t('orders.list.sortDirections.desc') },
              { value: 'asc', label: t('orders.list.sortDirections.asc') },
            ]}
            triggerClassName="w-full md:w-auto md:min-w-[150px]"
          />
          <FilterSelect
            value={String(perPage)}
            onValueChange={changePerPage}
            prefix={t('orders.list.perPage')}
            allLabel={t('orders.list.perPage')}
            allValue={String(DEFAULT_PER_PAGE)}
            options={PER_PAGE_OPTIONS.map((option) => ({
              value: String(option),
              label: String(option),
            }))}
            triggerClassName="w-full md:w-auto md:min-w-[130px]"
          />
        </div>
      </FilterBar>

      {isError && (
        <DataErrorState message={t('orders.listError')} onRetry={() => refetch()} />
      )}

      <OrdersTable
        data={(pageData?.data as TrackingOrderRow[]) || []}
        isLoading={isLoading}
        onRefresh={() => refetch()}
      />

      <Pagination
        page={pageData?.current_page ?? page}
        lastPage={pageData?.last_page ?? 1}
        total={pageData?.total ?? 0}
        from={pageData?.from ?? 0}
        to={pageData?.to ?? 0}
        perPage={pageData?.per_page ?? perPage}
        onPageChange={setPage}
        className="py-2"
      />

      {isFetching && !isLoading && (
        <p className="text-xs text-muted-foreground">{t('orders.list.refreshing')}</p>
      )}
    </div>
  );
}
