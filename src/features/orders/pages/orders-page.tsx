import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useOrders } from '../hooks/use-orders';
import { OrdersTable } from '../components/orders-table';

const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled', 'delivered'];
const PAYMENT_STATUSES = ['payment-success', 'payment-pending', 'payment-failed'];
const SHIPPING_METHODS = ['SCHEDULED'];

export function OrdersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [shippingMethod, setShippingMethod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, isError, refetch } = useOrders({
    page,
    limit: 15,
    search: search || undefined,
    status: status === 'all' ? undefined : status,
    payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
    shipping_method: shippingMethod === 'all' ? undefined : shippingMethod,
    created_from: dateFrom || undefined,
    created_to: dateTo || undefined,
  });

  const hasActiveFilters =
    search ||
    status !== 'all' ||
    paymentStatus !== 'all' ||
    shippingMethod !== 'all' ||
    dateFrom ||
    dateTo;

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setPaymentStatus('all');
    setShippingMethod('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('orders.title')} description={t('orders.subtitle')} />

      <FilterBar
        activeCount={
          [search, dateFrom, dateTo].filter(Boolean).length +
          [status, paymentStatus, shippingMethod].filter((v) => v !== 'all').length
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
              options={PAYMENT_STATUSES.map((s) => ({
                value: s,
                label: t(`orders.paymentStatuses.${s}`, { defaultValue: s }),
              }))}
              triggerClassName="w-full md:w-auto md:min-w-[200px]"
            />

            <FilterSelect
              value={shippingMethod}
              onValueChange={(value) => {
                setShippingMethod(value);
                setPage(1);
              }}
              prefix={t('orders.shippingMethod')}
              allLabel={t('orders.allShippingMethods')}
              options={SHIPPING_METHODS.map((s) => ({ value: s, label: s }))}
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
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {t('orders.dateFrom')}
            </span>
            <Input
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
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
                setPage(1);
              }}
              className="h-9 w-auto"
            />
          </div>
        </div>
      </FilterBar>

      {isError && (
        <DataErrorState message={t('orders.listError')} onRetry={() => refetch()} />
      )}

      <OrdersTable
        data={data?.data?.data || []}
        isLoading={isLoading}
        onRefresh={refetch}
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
    </div>
  );
}
