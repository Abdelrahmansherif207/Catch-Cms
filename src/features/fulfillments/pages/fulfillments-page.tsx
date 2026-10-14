import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { FulfillmentsTable } from '../components/fulfillments-table';
import { useFulfillments } from '../hooks/use-fulfillments';
import {
  FULFILLMENT_STATUSES,
  type FulfillmentStatus,
} from '../types/fulfillment.types';

const LIMIT_DEFAULT = 50;
const LIMIT_OPTIONS = [10, 25, 50, 100];

export function FulfillmentsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [status, setStatus] = useState<string>('all');
  const [warehouseId, setWarehouseId] = useState<string>('all');
  const [limit, setLimit] = useState<number>(LIMIT_DEFAULT);

  // Warehouse filter → server equality param; scoped callers keep home-only.
  const { data: warehousesResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehousesResponse?.data ?? [];
  const canGlobalManage = can(PERMISSIONS.warehouses.manage);

  const activeStatus = status === 'all' ? undefined : (status as FulfillmentStatus);
  const activeWarehouse =
    warehouseId === 'all' ? undefined : Number(warehouseId);

  const { data, isLoading, isError, refetch } = useFulfillments({
    status: activeStatus,
    warehouseId: activeWarehouse,
    limit,
  });

  const fulfillments = data?.data ?? [];
  const hasActiveFilters = status !== 'all' || warehouseId !== 'all';

  const handleClearFilters = () => {
    setStatus('all');
    setWarehouseId('all');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('fulfillments.pageTitle')}
        description={t('fulfillments.pageDescription')}
        actions={
          <>
            <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <FilterBar
        activeCount={
          [status, warehouseId].filter((v) => v !== 'all').length
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={status}
            onValueChange={setStatus}
            prefix={t('common.status')}
            allLabel={t('fulfillments.allStatuses')}
            options={FULFILLMENT_STATUSES.map((s) => ({
              value: s,
              label: t('fulfillments.status.' + s),
            }))}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />

          {canGlobalManage && warehouses.length > 0 && (
            <FilterSelect
              value={warehouseId}
              onValueChange={setWarehouseId}
              prefix={t('fulfillments.warehouse')}
              allLabel={t('fulfillments.allWarehouses')}
              options={warehouses.map((warehouse) => ({
                value: String(warehouse.id),
                label: warehouse.name + ' (' + warehouse.code + ')',
              }))}
              triggerClassName="w-full md:w-auto md:min-w-[200px]"
            />
          )}

          <Select
            value={String(limit)}
            onValueChange={(v) => {
              if (v !== null) setLimit(Number(v));
            }}
          >
            <SelectTrigger className="h-8 w-full md:w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              {t('common.clearFilters')}
            </Button>
          )}
        </div>
      </FilterBar>

      {isError ? (
        <DataErrorState message={t('fulfillments.listError')} onRetry={() => refetch()} />
      ) : (
        <FulfillmentsTable data={fulfillments} isLoading={isLoading} />
      )}
    </div>
  );
}
