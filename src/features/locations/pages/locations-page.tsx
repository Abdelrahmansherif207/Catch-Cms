import { useCallback, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { Can } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import { LocationsTable } from '../components/locations-table';
import { LocationFormDialog } from '../components/location-form-dialog';
import { useLocations } from '../hooks/use-locations';
import type { WarehouseLocation } from '../types/location.types';

export function LocationsPage() {
  const { t } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WarehouseLocation | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');

  // The index has no pagination — one capped fetch (limit ≤ 100); the
  // optional warehouse filter is applied by the BACKEND (warehouse_id param).
  const { data, isLoading, isError, refetch } = useLocations({
    limit: 100,
    warehouseId: warehouseFilter === 'all' ? null : warehouseFilter,
  });

  // Warehouse name labels come from the warehouses feature (read-only reuse).
  const warehousesQuery = useWarehouses({ limit: 100 });
  const warehouses = warehousesQuery.data?.data ?? [];
  const warehouseNames: Record<string, string> = {};
  for (const wh of warehouses) {
    warehouseNames[String(wh.id)] = wh.name;
  }

  const locations = data?.data ?? [];

  const handleCreate = useCallback(() => {
    setEditingLocation(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((location: WarehouseLocation) => {
    setEditingLocation(location);
    setFormOpen(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('locations.pageTitle')}
        description={t('locations.pageDescription')}
        actions={
          <>
            <div className="flex items-center gap-2">
              <Label className="sr-only">{t('locations.warehouse')}</Label>
              <Select
                value={warehouseFilter || 'all'}
                onValueChange={(v) => setWarehouseFilter(v === 'none' ? 'all' : (v ?? 'all'))}
              >
                <SelectTrigger className="h-8 w-44">
                  <SelectValue>
                    {warehouseFilter === 'all'
                      ? t('locations.filterAllWarehouses')
                      : (warehouseNames[warehouseFilter] ?? t('locations.warehouse'))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('locations.filterAllWarehouses')}</SelectItem>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={String(wh.id)}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Can permission={PERMISSIONS.locations.manage}>
              <Button onClick={handleCreate}>
                <Plus className="me-1.5 h-4 w-4" />
                {t('common.create')}
              </Button>
            </Can>
          </>
        }
      />

      {isError ? (
        <DataErrorState onRetry={() => refetch()} />
      ) : (
        <LocationsTable
          data={locations}
          isLoading={isLoading}
          warehouseNames={warehouseNames}
          handlers={{ onEdit: handleEdit, onDeleted: handleFormSuccess }}
        />
      )}

      <LocationFormDialog
        location={editingLocation}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
