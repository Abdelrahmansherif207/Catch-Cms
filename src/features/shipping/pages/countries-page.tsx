import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Button } from '@/shared/ui/button';
import { FilterSelect } from '@/shared/components/filter-select';
import { FilterBar } from '@/shared/ui/filter-bar';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { useCountries } from '../hooks/use-shipping';
import { CountriesTable } from '../components/countries-table';
import { CountryFormDialog } from '../components/country-form-dialog';
import type { Country } from '../types/shipping.types';

export function CountriesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const [formOpen, setFormOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

  const { data, isLoading, isError, refetch } = useCountries({ page, perPage: 15, search, status: status || undefined });
  const countries = data?.data?.data || [];
  const pagination = data?.data;

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('search', value);
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') params.set('status', value);
    else params.delete('status');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', p.toString());
    setSearchParams(params);
  };

  const openCreate = () => {
    setEditingCountry(null);
    setFormOpen(true);
  };

  const openEdit = (country: Country) => {
    setEditingCountry(country);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title={t('shipping.countriesTitle')}
        description={t('shipping.countriesSubtitle')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="me-2 h-4 w-4" />{t('shipping.createCountry')}
          </Button>
        }
      />

      <FilterBar activeCount={[search, status].filter(Boolean).length}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder={t('shipping.searchCountries')}
            className="sm:max-w-xs"
          />
          <FilterSelect
            value={status}
            onValueChange={handleStatusFilter}
            prefix={t('shipping.status')}
            allLabel={t('shipping.allStatuses')}
            options={[
              { value: '1', label: t('shipping.active') },
              { value: '0', label: t('shipping.inactive') },
            ]}
            allValue=""
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
        </div>
      </FilterBar>

      {isError && (
        <DataErrorState onRetry={() => refetch()} />
      )}

      <CountriesTable
        data={countries}
        isLoading={isLoading}
        onEdit={openEdit}
        onRefresh={() => refetch()}
      />

      <Pagination
        page={pagination?.current_page ?? page}
        lastPage={pagination?.last_page ?? 1}
        total={pagination?.total ?? 0}
        from={pagination?.from ?? 0}
        to={pagination?.to ?? 0}
        perPage={pagination?.per_page ?? 15}
        onPageChange={handlePageChange}
        className="py-2"
      />

      <CountryFormDialog
        country={editingCountry}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setEditingCountry(null);
          refetch();
        }}
      />
    </div>
  );
}
