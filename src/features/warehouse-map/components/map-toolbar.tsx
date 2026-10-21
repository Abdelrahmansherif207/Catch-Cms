import { useTranslation } from 'react-i18next';
import { Check, Pencil, RotateCcw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { FilterSelect } from '@/shared/components/filter-select';
import { SearchInput } from '@/shared/components/search-input';
import { LOCATION_TYPES } from '@/features/locations/types/location.types';
import type { Warehouse } from '@/features/warehouses/types/warehouse.types';
import type { PickBatchOption } from './pick-route-selector';
import { PickRouteSelector } from './pick-route-selector';

export interface MapToolbarProps {
  warehouses: Warehouse[];
  currentWarehouseId: number | null;
  onSwitchWarehouse: (warehouseId: number) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  binSearch: string;
  onBinSearchChange: (value: string) => void;
  batches: PickBatchOption[];
  batchesLoading: boolean;
  selectedBatchId: number | null;
  onBatchSelect: (batchId: number | null) => void;
  canViewRoutes: boolean;
  canEditLayout: boolean;
  layoutEditing: boolean;
  layoutDirty: boolean;
  onToggleEdit: () => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
}

/** All map controls in one wrapping row: warehouse switch, filters, route picker, layout editor. */
export function MapToolbar({
  warehouses,
  currentWarehouseId,
  onSwitchWarehouse,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  binSearch,
  onBinSearchChange,
  batches,
  batchesLoading,
  selectedBatchId,
  onBatchSelect,
  canViewRoutes,
  canEditLayout,
  layoutEditing,
  layoutDirty,
  onToggleEdit,
  onSaveLayout,
  onResetLayout,
}: MapToolbarProps) {
  const { t } = useTranslation();

  const typeOptions = LOCATION_TYPES.map((type) => ({
    value: type,
    label: t(`locations.types.${type}`),
  }));
  const statusOptions = [
    { value: 'active', label: t('warehouseMap.statusActive') },
    { value: 'inactive', label: t('warehouseMap.statusInactive') },
    { value: 'none', label: t('warehouseMap.statusNoStatus') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={currentWarehouseId !== null ? String(currentWarehouseId) : undefined}
        onValueChange={(value) => value && onSwitchWarehouse(Number(value))}
      >
        <SelectTrigger aria-label={t('locations.warehouse')} className="h-8 w-44">
          <span className="truncate">
            {warehouses.find((wh) => wh.id === currentWarehouseId)?.name ?? t('locations.warehouse')}
          </span>
        </SelectTrigger>
        <SelectContent>
          {warehouses.map((wh) => (
            <SelectItem key={wh.id} value={String(wh.id)}>
              {wh.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FilterSelect
        value={typeFilter}
        onValueChange={onTypeFilterChange}
        options={typeOptions}
        prefix={t('locations.typeCol')}
        allLabel={t('warehouseMap.allTypes')}
        triggerClassName="h-8"
      />
      <FilterSelect
        value={statusFilter}
        onValueChange={onStatusFilterChange}
        options={statusOptions}
        prefix={t('common.status')}
        allLabel={t('warehouseMap.allStatuses')}
        triggerClassName="h-8"
      />

      <SearchInput
        value={binSearch}
        onChange={onBinSearchChange}
        placeholder={t('warehouseMap.searchBins')}
        className="sm:max-w-[220px]"
        autoFocus={false}
      />

      {canEditLayout && !layoutEditing && (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onToggleEdit}
        >
          <Pencil className="me-1.5 h-3.5 w-3.5" />
          {t('warehouseMap.editLayout')}
        </Button>
      )}

      {canEditLayout && layoutEditing && (
        <>
          <Button
            size="sm"
            className="h-8"
            disabled={!layoutDirty}
            onClick={onSaveLayout}
          >
            <Check className="me-1.5 h-3.5 w-3.5" />
            {t('warehouseMap.saveLayout')}
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={onToggleEdit}>
            {t('warehouseMap.exitLayoutEdit')}
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={onResetLayout}>
            <RotateCcw className="me-1.5 h-3.5 w-3.5" />
            {t('warehouseMap.resetLayout')}
          </Button>
          {layoutDirty && (
            <span className="text-xs text-muted-foreground">
              {t('warehouseMap.layoutDirtyHint')}
            </span>
          )}
        </>
      )}

      {canViewRoutes && (
        <PickRouteSelector
          batchId={selectedBatchId}
          batches={batches}
          loading={batchesLoading}
          onSelect={onBatchSelect}
        />
      )}
    </div>
  );
}
