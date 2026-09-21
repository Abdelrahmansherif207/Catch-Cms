import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { FilterSelect } from '@/shared/components/filter-select';
import { FilterBar } from '@/shared/ui/filter-bar';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
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

  const { data, isLoading, isError, refetch } = useCurrencies(params);
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
      <PageHeader
        title={t('currencies.title')}
        description={t('currencies.subtitle')}
        actions={
          <Button onClick={handleCreateCurrency}>
            {t('currencies.addCurrency')}
          </Button>
        }
      />

      <FilterBar
        activeCount={
          [search].filter(Boolean).length +
          [activeFilter].filter((v) => v !== 'all').length
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(value) => { setSearch(value); setPage(1); }}
            placeholder={t('currencies.searchPlaceholder')}
          />
          <FilterSelect
            value={activeFilter}
            onValueChange={(v) => { setActiveFilter(v); setPage(1); }}
            prefix={t('common.status')}
            allLabel={t('currencies.allStatuses')}
            options={[
              { value: '1', label: t('currencies.active') },
              { value: '0', label: t('currencies.inactive') },
            ]}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
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
      </FilterBar>

      {isError && (
        <DataErrorState onRetry={() => refetch()} />
      )}

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
