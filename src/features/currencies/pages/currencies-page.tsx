import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { useCurrencies } from '../hooks/use-currencies';
import { CurrenciesTable } from '../components/currencies-table';
import { CurrencyFormDialog } from '../components/currency-form-dialog';
import { Pagination } from '@/shared/components/pagination';
import type { Currency } from '../types/currency.types';

export function CurrenciesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const params = {
    page,
    perPage,
    search: search || undefined,
    active: activeFilter === '1' ? true : activeFilter === '0' ? false : undefined,
  };

  const { data, isLoading, refetch } = useCurrencies(params);
  const currencies = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;
  const lastPage = data?.data?.last_page ?? 1;

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormOpen(true);
  };

  const handleCreateCurrency = () => {
    setEditingCurrency(null);
    setFormOpen(true);
  };

  const handleCurrencyFormSuccess = () => {
    setFormOpen(false);
    setEditingCurrency(null);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('currencies.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('currencies.subtitle')}</p>
        </div>
        <Button onClick={handleCreateCurrency}>
          {t('currencies.addCurrency')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('currencies.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="ps-9"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPage(1); }}>
            {t('common.clear')}
          </Button>
        )}
        <Select value={activeFilter} onValueChange={(v) => { if (v) { setActiveFilter(v); setPage(1); } }}>
          <SelectTrigger className="h-9 w-full md:w-[130px]">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('currencies.allStatuses')}</SelectItem>
            <SelectItem value="1">{t('currencies.active')}</SelectItem>
            <SelectItem value="0">{t('currencies.inactive')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
          <SelectTrigger className="h-9 w-full md:w-[80px]">
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

      <CurrenciesTable
        data={currencies}
        isLoading={isLoading}
        onEdit={handleEditCurrency}
        onRefresh={refetch}
      />

      <CurrencyFormDialog
        currency={editingCurrency}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleCurrencyFormSuccess}
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
    </div>
  );
}
