import { useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { PickupLocationsTable } from '../components/pickup-locations-table';
import { PickupLocationFormDialog } from '../components/pickup-location-form-dialog';
import { usePickupLocations } from '../hooks/use-pickup-locations';
import type { PickupLocation } from '../types/pickup-location.types';

export function PickupLocationsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortedBy, setSortedBy] = useState<'asc' | 'desc' | undefined>(undefined);
  const [openForm, setOpenForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PickupLocation | null>(null);

  const params = {
    page,
    perPage,
    search: search || undefined,
    active: statusFilter === '1' ? 'true' : undefined,
    inactive: statusFilter === '0' ? 'true' : undefined,
    order: sortedBy ? 'display_order' : undefined,
    sortedBy,
  };

  const { data, isLoading, isError, refetch } = usePickupLocations(params);

  const locations = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;

  const handleEdit = useCallback((location: PickupLocation) => {
    setEditingLocation(location);
    setOpenForm(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingLocation(null);
    setOpenForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setOpenForm(false);
    setEditingLocation(null);
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('pickupLocations.pageTitle')}
        actions={
          <>
            <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="me-1.5 h-4 w-4" />
              {t('common.create')}
            </Button>
          </>
        }
      />

      <FilterBar
        activeCount={
          [search].filter(Boolean).length +
          [statusFilter].filter((v) => v !== 'all').length
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('pickupLocations.searchPlaceholder')}
          />
          <FilterSelect
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            prefix={t('common.status')}
            allLabel={t('pickupLocations.allStatuses')}
            options={[
              { value: '1', label: t('pickupLocations.active') },
              { value: '0', label: t('pickupLocations.inactive') },
            ]}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
          <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v ?? '15')); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[90px]">
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

      <PickupLocationsTable
        data={locations}
        isLoading={isLoading}
        sortedBy={sortedBy}
        onToggleSort={() => {
          setSortedBy((prev) => (prev === 'asc' ? 'desc' : 'asc'));
          setPage(1);
        }}
        onEdit={handleEdit}
        onRefresh={() => refetch()}
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

      <PickupLocationFormDialog
        location={editingLocation}
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
