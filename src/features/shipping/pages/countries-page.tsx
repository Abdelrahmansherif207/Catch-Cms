import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/ui/select';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/shared/ui/pagination';
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
  const [searchInput, setSearchInput] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

  const { data, isLoading } = useCountries({ page, perPage: 15, search, status: status || undefined });
  const countries = data?.data?.data || [];
  const pagination = data?.data;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    if (status) params.set('status', status);
    params.set('page', '1');
    setSearchParams(params);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('shipping.countriesTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('shipping.countriesSubtitle')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="me-2 h-4 w-4" />{t('shipping.createCountry')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('shipping.searchCountries')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="ps-9"
          />
        </div>
        <Select value={status || 'all'} onValueChange={(v) => handleStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('common.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="1">{t('shipping.active')}</SelectItem>
            <SelectItem value="0">{t('shipping.inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CountriesTable
        data={countries}
        isLoading={isLoading}
        onEdit={openEdit}
        onRefresh={() => handleSearch()}
      />

      {pagination && pagination.last_page > 1 && (
        <Pagination>
          <PaginationContent>
            {pagination.current_page > 1 && (
              <PaginationItem>
                <PaginationPrevious onClick={() => handlePageChange(pagination.current_page - 1)} />
              </PaginationItem>
            )}
            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === pagination.current_page} onClick={() => handlePageChange(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            {pagination.current_page < pagination.last_page && (
              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(pagination.current_page + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}

      <CountryFormDialog
        country={editingCountry}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setEditingCountry(null);
          handleSearch();
        }}
      />
    </div>
  );
}
