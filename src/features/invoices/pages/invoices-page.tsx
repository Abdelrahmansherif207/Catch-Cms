import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Pagination } from '@/shared/components/pagination';
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

  const { data, isLoading } = useInvoices({
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('invoices.title')}</h1>
        <p className="text-muted-foreground">{t('invoices.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('invoices.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="ps-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value ?? 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder={t('invoices.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('invoices.allStatuses')}</SelectItem>
                {INVOICE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`invoices.status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currency}
              onValueChange={(value) => {
                setCurrency(value ?? 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[130px]">
                <SelectValue placeholder={t('invoices.allCurrencies')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('invoices.allCurrencies')}</SelectItem>
                {INVOICE_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={invoiceSeries}
              onValueChange={(value) => {
                setInvoiceSeries(value ?? 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[130px]">
                <SelectValue placeholder={t('invoices.allSeries', { defaultValue: 'All series' })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('invoices.allSeries', { defaultValue: 'All series' })}</SelectItem>
                {INVOICE_SERIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
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
      </div>

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