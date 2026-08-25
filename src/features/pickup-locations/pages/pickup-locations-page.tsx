import { useState, useCallback } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Pagination } from '@/shared/components/pagination';
import { PickupLocationsTable } from '../components/pickup-locations-table';
import { PickupLocationFormDialog } from '../components/pickup-location-form-dialog';
import { usePickupLocations } from '../hooks/use-pickup-locations';
import type { PickupLocation } from '../types/pickup-location.types';

export function PickupLocationsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
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

  const { data, isLoading, refetch } = usePickupLocations(params);

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

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t('pickupLocations.pageTitle')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="me-1.5 h-4 w-4" />
            {t('common.create')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleSearch}
            aria-label={t('common.search')}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Input
            placeholder={t('pickupLocations.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="h-8 ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? 'all'); setPage(1); }}>
          <SelectTrigger className="h-8 w-full md:w-[130px]">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pickupLocations.allStatuses')}</SelectItem>
            <SelectItem value="1">{t('pickupLocations.active')}</SelectItem>
            <SelectItem value="0">{t('pickupLocations.inactive')}</SelectItem>
          </SelectContent>
        </Select>
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
