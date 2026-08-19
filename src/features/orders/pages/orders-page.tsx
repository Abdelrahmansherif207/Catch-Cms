import { useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/shared/components/pagination';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { useOrders } from '../hooks/use-orders';
import { OrdersTable } from '../components/orders-table';

const ORDER_STATUSES = ['pending', 'completed', 'cancelled', 'delivered'];
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('orders.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('orders.subtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('orders.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="ps-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value ?? 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder={t('orders.allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('orders.allStatuses')}</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={paymentStatus}
            onValueChange={(value) => {
              setPaymentStatus(value ?? 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder={t('orders.allPaymentStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('orders.allPaymentStatuses')}</SelectItem>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={shippingMethod}
            onValueChange={(value) => {
              setShippingMethod(value ?? 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder={t('orders.allShippingMethods')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('orders.allShippingMethods')}</SelectItem>
              {SHIPPING_METHODS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              {t('common.clear')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{t('orders.dateFrom')}</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="h-9 w-auto"
        />
        <span>{t('orders.dateTo')}</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="h-9 w-auto"
        />
      </div>

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{t('orders.listError')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </div>
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
