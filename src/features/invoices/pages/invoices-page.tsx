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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { usePermissions } from '@/shared/auth/guards';
import { useInvoices, useInvoiceDownload } from '../hooks/use-invoices';
import { InvoicesTable } from '../components/invoices-table';
import {
  INVOICE_STATUSES,
  canDownloadPdf,
  getPaginationMeta,
} from '../lib/invoice-utils';
import { INVOICE_PERMISSIONS } from '../permissions/invoice.permissions';

const INVOICE_CURRENCIES = ['EGP', 'USD', 'SAR', 'AED', 'EUR'];
const INVOICE_SERIES = ['INV', 'CN', 'DN'];

export function InvoicesPage() {
  const { t } = useTranslation();
  const { can: hasPermission } = usePermissions();
  const canDownload = hasPermission(INVOICE_PERMISSIONS.download);
  const { download } = useInvoiceDownload();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [status, setStatus] = useState('all');
  const [currency, setCurrency] = useState('all');
  const [invoiceSeries, setInvoiceSeries] = useState('all');
  const [orderId, setOrderId] = useState('');
  const [userId, setUserId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orderBy, setOrderBy] = useState<'created_at' | 'total' | 'status' | 'invoice_number'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const parsedOrderId = orderId.trim() === '' ? undefined : Number(orderId);
  const parsedUserId = userId.trim() === '' ? undefined : Number(userId);

  const { data, isLoading, isError, refetch } = useInvoices({
    page,
    limit: perPage,
    search: search || undefined,
    status: status === 'all' ? undefined : status,
    order_id: parsedOrderId != null && Number.isFinite(parsedOrderId) ? parsedOrderId : undefined,
    user_id: parsedUserId != null && Number.isFinite(parsedUserId) ? parsedUserId : undefined,
    invoice_series: invoiceSeries === 'all' ? undefined : invoiceSeries,
    currency: currency === 'all' ? undefined : currency,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    sort_by: orderBy,
    sort_direction: sortDir,
  });

  const pagination = getPaginationMeta(data?.data);

  const hasActiveFilters =
    search ||
    status !== 'all' ||
    currency !== 'all' ||
    invoiceSeries !== 'all' ||
    orderId.trim() !== '' ||
    userId.trim() !== '' ||
    dateFrom ||
    dateTo;

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setCurrency('all');
    setInvoiceSeries('all');
    setOrderId('');
    setUserId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleSortChange = (field: 'created_at' | 'total' | 'status' | 'invoice_number') => {
    if (orderBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('invoices.title')} description={t('invoices.subtitle')} />

      <FilterBar
        activeCount={
          [search, dateFrom, dateTo, orderId.trim(), userId.trim()].filter(Boolean).length +
          [status, currency, invoiceSeries].filter((v) => v !== 'all').length
        }
      >
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('invoices.searchPlaceholder')}
            className="flex-1"
          />

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              prefix={t('invoices.statusColumn')}
              allLabel={t('invoices.allStatuses')}
              options={INVOICE_STATUSES.map((s) => ({
                value: s,
                label: t(`invoices.status.${s}`, { defaultValue: s }),
              }))}
              triggerClassName="w-full md:w-auto md:min-w-[190px]"
            />

            <FilterSelect
              value={currency}
              onValueChange={(value) => {
                setCurrency(value);
                setPage(1);
              }}
              prefix={t('invoices.currency')}
              allLabel={t('invoices.allCurrencies')}
              options={INVOICE_CURRENCIES.map((c) => ({ value: c, label: c }))}
              triggerClassName="w-full md:w-auto md:min-w-[190px]"
            />

            <FilterSelect
              value={invoiceSeries}
              onValueChange={(value) => {
                setInvoiceSeries(value);
                setPage(1);
              }}
              prefix={t('invoices.series')}
              allLabel={t('invoices.allSeries')}
              options={INVOICE_SERIES.map((s) => ({ value: s, label: s }))}
              triggerClassName="w-full md:w-auto md:min-w-[190px]"
            />

            <Input
              type="number"
              min={1}
              placeholder={t('invoices.orderId', { defaultValue: 'Order ID' })}
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full md:w-[130px]"
            />
            <Input
              type="number"
              min={1}
              placeholder={t('invoices.userId', { defaultValue: 'User ID' })}
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full md:w-[130px]"
            />

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                {t('common.clear')}
              </Button>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('invoices.from')}</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-9 w-auto"
            />
            <span>{t('invoices.to')}</span>
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

          <div className="flex items-center gap-2 sm:ms-auto">
            <span className="text-sm text-muted-foreground">{t('common.perPage')}</span>
            <Select
              value={String(perPage)}
              onValueChange={(value) => {
                if (value) {
                  setPerPage(Number(value));
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="h-9 w-full md:w-[90px]">
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
        </div>
      </FilterBar>

      {isError && (
        <DataErrorState message={t('invoices.listError')} onRetry={() => refetch()} />
      )}

      <InvoicesTable
        data={data?.data?.data || []}
        isLoading={isLoading}
        orderBy={orderBy}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        canDownload={canDownload}
        onDownload={(invoice) => {
          if (canDownloadPdf(invoice)) download(invoice);
        }}
      />

      <Pagination
        page={page}
        lastPage={pagination.lastPage}
        total={pagination.total}
        from={pagination.from}
        to={pagination.to}
        perPage={pagination.perPage}
        onPageChange={setPage}
        className="py-2"
      />

      {isLoading && <span className="sr-only">{t('invoices.loading')}</span>}
    </div>
  );
}