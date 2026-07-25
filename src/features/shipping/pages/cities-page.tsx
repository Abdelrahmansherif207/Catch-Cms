import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, ArrowLeft } from 'lucide-react';
import { useSearchParams, useParams, useNavigate } from 'react-router';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/shared/ui/pagination';
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
  const [searchInput, setSearchInput] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  const { data, isLoading } = useCities({ page, perPage: 15, search, governorate_id: governorateId });
  const cities = data?.data?.data || [];
  const pagination = data?.data;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    params.set('page', '1');
    setSearchParams(params);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('shipping.citiesTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('shipping.citiesSubtitle')}</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="me-2 h-4 w-4" />{t('shipping.createCity')}
        </Button>
      </div>

      <div className="relative flex-1 max-w-xs">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('shipping.searchCities')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="ps-9"
        />
      </div>

      <CitiesTable
        data={cities}
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

      <CityFormDialog
        city={editingCity}
        governorateId={governorateId}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setEditingCity(null);
          handleSearch();
        }}
      />
    </div>
  );
}
