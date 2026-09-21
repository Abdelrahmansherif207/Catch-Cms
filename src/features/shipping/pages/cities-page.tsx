import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowLeft } from 'lucide-react';
import { useSearchParams, useParams, useNavigate } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { useCities } from '../hooks/use-shipping';
import { CitiesTable } from '../components/cities-table';
import { CityFormDialog } from '../components/city-form-dialog';
import type { City } from '../types/shipping.types';

export function CitiesPage() {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const governorateId = params.governorateId ? Number(params.governorateId) : undefined;
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const [formOpen, setFormOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  const { data, isLoading, isError, refetch } = useCities({ page, perPage: 15, search, governorate_id: governorateId });
  const cities = data?.data?.data || [];
  const pagination = data?.data;

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('search', value);
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', p.toString());
    setSearchParams(params);
  };

  const openCreate = () => {
    setEditingCity(null);
    setFormOpen(true);
  };

  const openEdit = (city: City) => {
    setEditingCity(city);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)} aria-label={t('common.back')} className="shrink-0">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <PageHeader
          title={t('shipping.citiesTitle')}
          description={t('shipping.citiesSubtitle')}
          actions={
            <Button onClick={openCreate}>
              <Plus className="me-2 h-4 w-4" />{t('shipping.createCity')}
            </Button>
          }
          className="flex-1"
        />
      </div>

      <SearchInput
        value={search}
        onChange={handleSearchChange}
        placeholder={t('shipping.searchCities')}
        className="sm:max-w-xs"
      />

      {isError && (
        <DataErrorState onRetry={() => refetch()} />
      )}

      <CitiesTable
        data={cities}
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

      <CityFormDialog
        city={editingCity}
        governorateId={governorateId}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setEditingCity(null);
          refetch();
        }}
      />
    </div>
  );
}
