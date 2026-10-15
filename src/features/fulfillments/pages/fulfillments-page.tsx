import { useCallback, useMemo, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { BulkSelectionBar } from '@/shared/components/bulk-selection-bar';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { FulfillmentsTable } from '../components/fulfillments-table';
import { BulkCreatePackingTasksDialog } from '../components/bulk-create-packing-tasks-dialog';
import { BulkCreateShipmentsDialog } from '../components/bulk-create-shipments-dialog';
import { CreateBatchDialog } from '@/features/batches/components/create-batch-dialog';
import {
  FULFILLMENT_BULK_MODES,
  type FulfillmentBulkMode,
  type FulfillmentBulkModeDef,
} from '../components/bulk-modes';
import { batchRoutes } from '@/features/batches/routes/batch.routes';
import { useFulfillments } from '../hooks/use-fulfillments';
import {
  FULFILLMENT_STATUSES,
  type FulfillmentStatus,
} from '../types/fulfillment.types';

const LIMIT_DEFAULT = 50;
const LIMIT_OPTIONS = [10, 25, 50, 100];

/** Matches the bulk endpoints' hard cap (1–100 fulfillment ids). */
const BULK_MAX = 100;

export function FulfillmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [status, setStatus] = useState<string>('all');
  const [warehouseId, setWarehouseId] = useState<string>('all');
  const [limit, setLimit] = useState<number>(LIMIT_DEFAULT);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activeMode, setActiveMode] = useState<FulfillmentBulkMode | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [packingDialogOpen, setPackingDialogOpen] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);

  // One bulk mode per cycle stage. Activating a mode PINS the status filter
  // to its eligible status and clears any stale selection.
  const allowMode = useCallback(
    (mode: FulfillmentBulkModeDef) => can(mode.permission),
    [can]
  );
  const visibleModes = useMemo(
    () => FULFILLMENT_BULK_MODES.filter(allowMode),
    [allowMode]
  );

  const activateMode = useCallback((mode: FulfillmentBulkModeDef | null) => {
    setActiveMode(mode ? mode.key : null);
    setStatus(mode ? mode.status : 'all');
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((rows: { id: number }[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const row of rows) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  }, []);

  // Selection resets whenever the visible page changes shape — stale ids in
  // the bulk modal would mean submitting rows the operator can no longer see.
  const handleStatusChange = useCallback(
    (value: string) => {
      // While a bulk mode is active the status filter is pinned (the chips
      // below show why); the mode's exit is the way to change it.
      if (activeMode !== null) return;
      setStatus(value);
      setSelectedIds(new Set());
    },
    [activeMode]
  );

  const handleWarehouseChange = useCallback((value: string) => {
    setWarehouseId(value);
    setSelectedIds(new Set());
  }, []);

  // Warehouse filter → server equality param; scoped callers keep home-only.
  const { data: warehousesResponse } = useWarehouses({ limit: 100 });
  const warehouses = warehousesResponse?.data ?? [];
  const canGlobalManage = can(PERMISSIONS.warehouses.manage);

  const activeStatus = status === 'all' ? undefined : (status as FulfillmentStatus);
  const activeWarehouse = warehouseId === 'all' ? undefined : Number(warehouseId);

  const { data, isLoading, isError, refetch } = useFulfillments({
    status: activeStatus,
    warehouseId: activeWarehouse,
    limit,
  });

  const fulfillments = useMemo(() => data?.data ?? [], [data]);
  const hasActiveFilters = status !== 'all' || warehouseId !== 'all';
  const selectedCount = selectedIds.size;
  const selectedRows = useMemo(
    () =>
      Array.from(selectedIds)
        .map((id) => fulfillments.find((row) => row.id === id))
        .filter((row) => row !== undefined),
    [fulfillments, selectedIds]
  );

  const modeDef = activeMode
    ? (FULFILLMENT_BULK_MODES.find((m) => m.key === activeMode) ?? null)
    : null;

  const handleClearFilters = () => {
    setActiveMode(null);
    setStatus('all');
    setWarehouseId('all');
    setSelectedIds(new Set());
  };

  const openModeDialog = useCallback(() => {
    if (!activeMode) return;
    if (activeMode === 'wave') setBatchDialogOpen(true);
    if (activeMode === 'packing') setPackingDialogOpen(true);
    if (activeMode === 'shipping') setShippingDialogOpen(true);
  }, [activeMode]);

  const modeDone = useCallback(() => {
    setSelectedIds(new Set());
    setBatchDialogOpen(false);
    setPackingDialogOpen(false);
    setShippingDialogOpen(false);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('fulfillments.pageTitle')}
        description={t('fulfillments.pageDescription')}
        actions={
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {visibleModes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {visibleModes.map((mode) => {
            const ModeIcon = mode.icon;
            const active = activeMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => activateMode(active ? null : mode)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary/10 font-medium text-primary shadow-[inset_2px_0_0_0_var(--primary)]'
                    : 'bg-card text-muted-foreground hover:bg-muted/60'
                )}
              >
                <ModeIcon className="h-4 w-4" />
                {t(mode.labelKey)}
                <span className="text-xs opacity-70">
                  · {t('fulfillments.mode.preview', { status: t('fulfillments.status.' + mode.status) })}
                </span>
              </button>
            );
          })}
          {activeMode && (
            <span className="text-xs text-muted-foreground">
              {t('fulfillments.mode.pinned')}
            </span>
          )}
        </div>
      )}

      <FilterBar
        activeCount={
          [status, warehouseId].filter((v) => v !== 'all').length
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={status}
            onValueChange={handleStatusChange}
            disabled={activeMode !== null}
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
              onValueChange={handleWarehouseChange}
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
              if (v !== null) {
                setLimit(Number(v));
                setSelectedIds(new Set());
              }
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

          {activeMode && (
            <Button variant="ghost" size="sm" onClick={() => activateMode(null)}>
              <X className="me-1 h-3.5 w-3.5" />
              {t('fulfillments.mode.exit',
                { mode: t(modeDef?.labelKey ?? '') })}
            </Button>
          )}

          {hasActiveFilters && !activeMode && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              {t('common.clearFilters')}
            </Button>
          )}
        </div>
      </FilterBar>

      {activeMode && selectedCount > 0 && modeDef && (
        <BulkSelectionBar
          count={selectedCount}
          cap={BULK_MAX}
          chips={selectedRows.map((row) => ({
            id: row.id,
            label: row.fulfillment_number,
          }))}
          onRemoveChip={toggleSelect}
          onClear={() => setSelectedIds(new Set())}
          heading={t(modeDef.labelKey)}
        >
          <Button
            size="sm"
            onClick={openModeDialog}
            disabled={selectedRows.length > BULK_MAX}
            title={selectedRows.length > BULK_MAX ? t('common.selectedCap', { max: BULK_MAX }) : undefined}
          >
            {t(modeDef.actionKey, { count: selectedCount })}
          </Button>
        </BulkSelectionBar>
      )}

      {isError ? (
        <DataErrorState message={t('fulfillments.listError')} onRetry={() => refetch()} />
      ) : (
        <FulfillmentsTable
          data={fulfillments}
          isLoading={isLoading}
          selectedIds={activeMode ? selectedIds : undefined}
          onToggle={activeMode ? toggleSelect : undefined}
          onToggleAll={activeMode ? toggleAll : undefined}
          eligibleStatus={modeDef ? modeDef.status : null}
        />
      )}

      {/* Wave mode → the existing batch wizard, seeded with the staged ids
          (it opens on the review step). Navigating away confirms creation. */}
      {batchDialogOpen && selectedRows.length > 0 && (
        <CreateBatchDialog
          initialIds={selectedRows.map((row) => row.id)}
          open
          onOpenChange={(open) => !open && modeDone()}
          onCreated={(batchId) => {
            navigate(batchRoutes.detail(batchId));
            modeDone();
          }}
        />
      )}

      {packingDialogOpen && selectedRows.length > 0 && (
        <BulkCreatePackingTasksDialog
          selected={selectedRows}
          maxCount={BULK_MAX}
          open
          onOpenChange={(open) => !open && modeDone()}
          onSuccess={modeDone}
        />
      )}

      {shippingDialogOpen && selectedRows.length > 0 && (
        <BulkCreateShipmentsDialog
          selected={selectedRows}
          maxCount={BULK_MAX}
          open
          onOpenChange={(open) => !open && modeDone()}
          onSuccess={modeDone}
        />
      )}
    </div>
  );
}
