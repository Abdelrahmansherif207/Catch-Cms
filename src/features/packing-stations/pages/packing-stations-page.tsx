import { useCallback, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { Can, usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { PackingStationsTable } from '../components/packing-stations-table';
import { PackingStationFormDialog } from '../components/packing-station-form-dialog';
import { usePackingStations } from '../hooks/use-packing-stations';
import type { PackingStation, PackingStationStatus } from '../types/packing-station.types';

const STATUS_FILTER_ALL = 'all';
const STATUS_FILTER_OPTIONS = ['active', 'inactive', 'maintenance'] as const;

export function PackingStationsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.packingStations.manage);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<PackingStation | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);

  // One capped fetch (limit ≤ 100); the list is flat with no pagination keys,
  // so the status filter is applied client-side over the fetched page —
  // swapping it for the server `status` param is a one-line change if the
  // row count ever outgrows a single request.
  const { data, isLoading, isError, refetch } = usePackingStations({ limit: 100 });

  const stations = useMemo(() => {
    const rows = data?.data ?? [];
    if (statusFilter === STATUS_FILTER_ALL) return rows;
    return rows.filter((station) => station.status === (statusFilter as PackingStationStatus));
  }, [data, statusFilter]);

  const handleCreate = useCallback(() => {
    setEditingStation(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((station: PackingStation) => {
    setEditingStation(station);
    setFormOpen(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('packingStations.pageTitle')}
        description={t('packingStations.pageDescription')}
        actions={
          <>
            <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Can permission={PERMISSIONS.packingStations.manage}>
              <Button onClick={handleCreate}>
                <Plus className="me-1.5 h-4 w-4" />
                {t('common.create')}
              </Button>
            </Can>
          </>
        }
      />

      <FilterBar
        activeCount={[statusFilter].filter((v) => v !== STATUS_FILTER_ALL).length}
      >
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            prefix={t('common.status')}
            allLabel={t('packingStations.allStatuses')}
            options={STATUS_FILTER_OPTIONS.map((status) => ({
              value: status,
              label: t('packingStations.status.' + status),
            }))}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
        </div>
      </FilterBar>

      {isError ? (
        <DataErrorState onRetry={() => refetch()} />
      ) : (
        <PackingStationsTable
          data={stations}
          isLoading={isLoading}
          canManage={canManage}
          onEdit={handleEdit}
          onRefresh={() => refetch()}
        />
      )}

      <PackingStationFormDialog
        station={editingStation}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
