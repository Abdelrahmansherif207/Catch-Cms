import { useCallback, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { Can } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { WarehousesTable } from '../components/warehouses-table';
import { WarehouseFormDialog } from '../components/warehouse-form-dialog';
import { useWarehouses } from '../hooks/use-warehouses';
import type { Warehouse } from '../types/warehouse.types';

export function WarehousesPage() {
  const { t } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // The index has no pagination/filter params — one capped fetch (limit ≤ 100).
  const { data, isLoading, isError, refetch } = useWarehouses({ limit: 100 });

  const warehouses = data?.data ?? [];

  const handleCreate = useCallback(() => {
    setEditingWarehouse(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormOpen(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('warehouses.pageTitle')}
        description={t('warehouses.pageDescription')}
        actions={
          <>
            <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Can permission={PERMISSIONS.warehouses.manage}>
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
        <WarehousesTable
          data={warehouses}
          isLoading={isLoading}
          handlers={{ onEdit: handleEdit, onArchived: handleFormSuccess }}
        />
      )}

      <WarehouseFormDialog
        warehouse={editingWarehouse}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
