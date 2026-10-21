import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Boxes, PackageSearch, Pencil, Route, TriangleAlert } from 'lucide-react';
import type { NodePositionChange } from '@xyflow/react';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { DataEmptyState } from '@/shared/components/data-state';
import { CardSection } from '@/shared/components/card-section';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useWarehouse, useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import { warehouseRoutes } from '@/features/warehouses/routes/warehouse.routes';
import { useLocations } from '@/features/locations/hooks/use-locations';
import { buildBinLayout } from '../lib/layout';
import { aggregateContents } from '../lib/contents';
import { binsOfGroup, mergePositions, withOverrides } from '../lib/layout-override';
import {
  clearLayout,
  loadLayout,
  saveLayout,
  type BinPosition,
} from '../lib/map-layout-store';
import {
  useBinContents,
  usePickRoute,
  useWarehousePickingTasks,
} from '../hooks/use-warehouse-map';
import { WarehouseMapCanvas } from '../components/warehouse-map-canvas';
import { MapToolbar } from '../components/map-toolbar';
import { MapLegend } from '../components/map-legend';
import { ProductsSidebar, type LocatedProduct } from '../components/products-sidebar';
import { BinDetailsPanel } from '../components/bin-details-panel';
import { warehouseMapRoutes } from '../routes/warehouse-map.routes';

const LOCATIONS_SERVER_CAP = 100;

/** URL shell — validates the :id and remounts one workspace per warehouse. */
export function WarehouseMapPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const parsedId = id !== undefined ? Number(id) : Number.NaN;
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return (
      <div className="space-y-4">
        <PageHeader title={t('warehouseMap.title')} />
        <DataErrorState message={t('warehouseMap.invalidWarehouse')} />
      </div>
    );
  }

  // key = warehouseId → switching warehouses remounts, so editor state
  // (saved-arrangement hydration, in-session edits, selections) resets cleanly.
  return <WarehouseMapWorkspace key={parsedId} warehouseId={parsedId} />;
}

interface WarehouseMapWorkspaceProps {
  warehouseId: number;
}

function WarehouseMapWorkspace({ warehouseId }: WarehouseMapWorkspaceProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const warehouseQuery = useWarehouse(warehouseId);
  const warehousesQuery = useWarehouses({ limit: 100 });
  const locationsQuery = useLocations({
    warehouseId,
    limit: LOCATIONS_SERVER_CAP,
  });

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [binSearch, setBinSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<LocatedProduct | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedBinId, setSelectedBinId] = useState<number | null>(null);

  // ─── Layout editor state ────────────────────────────────────────────
  // SAVED is hydrated once per mount from the (currently localStorage)
  // persistence layer; EDIT holds the in-session drag deltas (never saved
  // until the toolbar Save is used).
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [savedPositions, setSavedPositions] = useState<Map<number, BinPosition>>(
    () => loadLayout(warehouseId)
  );
  const [editPositions, setEditPositions] = useState<Map<number, BinPosition>>(new Map());
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const canEditLayout = can(PERMISSIONS.locations.manage);
  const layoutDirty = editPositions.size > 0;

  const warehouse = warehouseQuery.data?.data ?? null;
  const locations = useMemo(() => locationsQuery.data?.data ?? [], [locationsQuery.data]);
  const layout = useMemo(() => buildBinLayout(locations), [locations]);

  // Effective positions: EDIT > SAVED > auto-computed; aisle labels re-derive
  // from member bins so headers always ride along with their column.
  const effectiveLayout = useMemo(
    () => withOverrides(layout, mergePositions(savedPositions, editPositions)),
    [layout, savedPositions, editPositions]
  );

  // Picking tasks of this warehouse → batch options (only for picking viewers).
  const canViewRoutes = can(PERMISSIONS.fulfillments.picking);
  const canCheckOccupancy = can(PERMISSIONS.locations.checkOccupancy);

  const tasksQuery = useWarehousePickingTasks(warehouseId, canViewRoutes);
  const batches = useMemo(() => {
    const counts = new Map<number, number>();
    for (const task of tasksQuery.data?.data ?? []) {
      if (task.batch_id !== null) {
        counts.set(task.batch_id, (counts.get(task.batch_id) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([batchId, count]) => ({
        id: batchId,
        label: `#${batchId} · ${t('warehouseMap.routeTasks', { count })}`,
      }));
  }, [tasksQuery.data, t]);

  // ─── Bin contents (batched check-occupancy) ─────────────────────────
  const locationIds = useMemo(() => locations.map((loc) => loc.id), [locations]);
  const contentsQuery = useBinContents(
    warehouseId,
    locationIds,
    canCheckOccupancy && locations.length > 0
  );
  const contents = useMemo(
    () => (contentsQuery.data ? aggregateContents(contentsQuery.data.occupied) : null),
    [contentsQuery.data]
  );

  // Always-on chips: total stored units per occupied bin.
  const unitsByLocation = useMemo(() => {
    const map = new Map<number, number>();
    if (contents) {
      for (const [id, summary] of contents.byLocation) map.set(id, summary.totalQuantity);
    }
    return map;
  }, [contents]);

  // Product focus mode — highlights resolve from the batched check-occupancy
  // data that is already client-side (no per-product request anymore).
  const productOnMap = selectedProduct
    ? contents?.byProduct.get(selectedProduct.id) ?? null
    : null;
  const productUnitsByLocation = useMemo(() => {
    const productId = selectedProduct?.id;
    if (!contents || !productOnMap || !productId) return unitsByLocation;
    const map = new Map<number, number>();
    for (const locationId of productOnMap.locationIds) {
      const summary = contents.byLocation.get(locationId);
      if (!summary) continue;
      const units = summary.products.reduce(
        (sum, row) => (row.product_id === productId ? sum + (row.quantity ?? 0) : sum),
        0
      );
      map.set(locationId, units);
    }
    return map;
  }, [contents, productOnMap, selectedProduct, unitsByLocation]);

  // Route focus mode — resolved walking order of one batch.
  const routeQuery = usePickRoute(canViewRoutes ? selectedBatchId : null);
  const route = routeQuery.data ?? null;

  // Bin details selectors.
  const selectedBin = useMemo(() => {
    const node = effectiveLayout.bins.find((bin) => bin.location.id === selectedBinId);
    return node?.location ?? null;
  }, [effectiveLayout, selectedBinId]);
  const parentBin = useMemo(() => {
    const parentId = selectedBin?.parent_id ?? null;
    if (parentId === null) return null;
    return locations.find((loc) => loc.id === parentId) ?? null;
  }, [locations, selectedBin]);
  const selectedRouteStop = useMemo(() => {
    if (route === null || selectedBinId === null) return null;
    return route.stops.find((stop) => stop.locationId === selectedBinId) ?? null;
  }, [route, selectedBinId]);
  const selectedBinContents =
    selectedBinId !== null ? contents?.byLocation.get(selectedBinId) ?? null : null;
  const binProducts = selectedBinContents?.products ?? [];
  const binProductsReady = contents !== null;

  const highlightIds = useMemo(() => {
    const ids = new Set<number>();
    if (productOnMap) {
      for (const locationId of productOnMap.locationIds) ids.add(locationId);
    } else if (route) {
      for (const stop of route.stops) {
        if (stop.locationId !== null) ids.add(stop.locationId);
      }
    }
    return ids;
  }, [productOnMap, route]);

  const stockByLocation = productOnMap ? productUnitsByLocation : unitsByLocation;

  const isVisible = useCallback(
    (loc: (typeof locations)[number]) => {
      if (typeFilter !== 'all' && (loc.type ?? 'none') !== typeFilter) return false;
      if (statusFilter !== 'all' && (loc.status ?? 'none') !== statusFilter) return false;
      const query = binSearch.trim().toLowerCase();
      if (query) {
        const code = loc.code.toLowerCase();
        const name = loc.name.toLowerCase();
        if (!code.includes(query) && !name.includes(query)) return false;
      }
      return true;
    },
    [typeFilter, statusFilter, binSearch]
  );

  // Focus modes are mutually exclusive.
  const handleProductSelect = useCallback((product: LocatedProduct | null) => {
    setSelectedProduct(product);
    if (product) setSelectedBatchId(null);
  }, []);
  const handleBatchSelect = useCallback((batchId: number | null) => {
    setSelectedBatchId(batchId);
    if (batchId !== null) setSelectedProduct(null);
  }, []);

  // ─── Layout editor handlers ─────────────────────────────────────────
  const handleBinPositionChange = useCallback((binId: number, position: BinPosition) => {
    setEditPositions((previous) => {
      const next = new Map(previous);
      next.set(binId, {
        x: Math.max(0, Math.round(position.x)),
        y: Math.max(0, Math.round(position.y)),
      });
      return next;
    });
  }, []);

  // Dragging an aisle header translates its WHOLE column — delta computed
  // against the header's derived position so bins land exactly where the
  // drop lands.
  const handleGroupTranslate = useCallback((groupKey: string, target: BinPosition) => {
    setEditPositions((previous) => {
      const effective = withOverrides(layout, mergePositions(savedPositions, previous));
      const header = effective.groups.find((group) => group.key === groupKey);
      const members = binsOfGroup(effective, groupKey);
      if (!header || members.length === 0) return previous;
      const dx = target.x - header.x;
      const dy = target.y - header.y;
      const next = new Map(previous);
      for (const member of members) {
        next.set(member.location.id, {
          x: Math.max(0, Math.round(member.x + dx)),
          y: Math.max(0, Math.round(member.y + dy)),
        });
      }
      return next;
    });
  }, [layout, savedPositions]);

  const handleNodesPositionChange = useCallback(
    (changes: NodePositionChange[]) => {
      for (const change of changes) {
        if (change.type !== 'position' || !change.position) continue;
        if (change.id.startsWith('bin-')) {
          handleBinPositionChange(Number(change.id.slice(4)), change.position);
        } else if (change.id.startsWith('group-')) {
          handleGroupTranslate(change.id.slice(6), change.position);
        }
      }
    },
    [handleBinPositionChange, handleGroupTranslate]
  );

  const handleSaveLayout = useCallback(() => {
    const positions = new Map<number, BinPosition>();
    for (const bin of effectiveLayout.bins) {
      positions.set(bin.location.id, { x: bin.x, y: bin.y });
    }
    saveLayout(warehouseId, positions);
    setSavedPositions(positions);
    setEditPositions(new Map());
    toast.success(t('warehouseMap.layoutSaved'));
  }, [warehouseId, effectiveLayout, t]);

  const handleExitEdit = useCallback(() => {
    if (editPositions.size > 0) setConfirmDiscard(true);
    else setLayoutEditing(false);
  }, [editPositions]);

  const confirmDiscardChanges = useCallback(() => {
    setEditPositions(new Map());
    setConfirmDiscard(false);
    setLayoutEditing(false);
  }, []);

  const confirmResetLayout = useCallback(() => {
    clearLayout(warehouseId);
    setSavedPositions(new Map());
    setEditPositions(new Map());
    setConfirmReset(false);
  }, [warehouseId]);

  // ─── Hard states ────────────────────────────────────────────────────
  if (warehouseQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader title={t('warehouseMap.title')} crumbs={[{ label: t('sidebar.warehouses'), to: warehouseRoutes.list }]} />
        <DataErrorState
          message={(warehouseQuery.error as { message?: string })?.message}
          onRetry={() => warehouseQuery.refetch()}
        />
      </div>
    );
  }

  if (locationsQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader title={t('warehouseMap.title')} crumbs={[{ label: t('sidebar.warehouses'), to: warehouseRoutes.list }]} />
        <DataErrorState
          message={(locationsQuery.error as { message?: string })?.message}
          onRetry={() => locationsQuery.refetch()}
        />
      </div>
    );
  }

  const truncated = locations.length >= LOCATIONS_SERVER_CAP;

  // ─── Page ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <PageHeader
        title={warehouse ? `${warehouse.name} — ${t('warehouseMap.title')}` : t('warehouseMap.title')}
        description={t('warehouseMap.pageDescription')}
        crumbs={[
          { label: t('sidebar.warehouses'), to: warehouseRoutes.list },
          ...(warehouse ? [{ label: warehouse.code }] : []),
        ]}
        meta={
          <span>
            {t('warehouseMap.binsCount', { count: locations.length })}
            {truncated ? ` · ${t('warehouseMap.truncatedShort')}` : ''}
          </span>
        }
      />

      {truncated && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{t('warehouseMap.truncatedWarning')}</p>
        </div>
      )}

      <MapToolbar
        warehouses={warehousesQuery.data?.data ?? []}
        currentWarehouseId={warehouseId}
        onSwitchWarehouse={(nextId) => {
          if (nextId !== warehouseId) navigate(warehouseMapRoutes.detail(nextId));
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        binSearch={binSearch}
        onBinSearchChange={setBinSearch}
        batches={batches}
        batchesLoading={tasksQuery.isLoading}
        selectedBatchId={selectedBatchId}
        onBatchSelect={handleBatchSelect}
        canViewRoutes={canViewRoutes}
        canEditLayout={canEditLayout}
        layoutEditing={layoutEditing}
        layoutDirty={layoutDirty}
        onToggleEdit={layoutEditing ? handleExitEdit : () => setLayoutEditing(true)}
        onSaveLayout={handleSaveLayout}
        onResetLayout={() => setConfirmReset(true)}
      />

      {layoutEditing && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-sm text-foreground">
          <Pencil className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>{t('warehouseMap.layoutEditHint')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {locationsQuery.isLoading ? (
            <Skeleton className="h-[560px] w-full rounded-2xl md:h-[640px]" />
          ) : locations.length === 0 ? (
            <DataEmptyState
              title={t('warehouseMap.emptyBins')}
              description={t('warehouseMap.emptyBinsHint')}
            />
          ) : (
            <WarehouseMapCanvas
              layout={effectiveLayout}
              isVisible={isVisible}
              highlightIds={highlightIds}
              stockByLocation={stockByLocation}
              routeStops={route?.stops ?? []}
              selectedBinId={selectedBinId}
              onSelectBin={setSelectedBinId}
              editable={layoutEditing}
              onNodesPositionChange={handleNodesPositionChange}
            />
          )}
        </div>

        <div className="space-y-4">
          <MapLegend />

          {canCheckOccupancy && locations.length > 0 && (
            <ProductsSidebar
              index={contents}
              loading={contents === null}
              error={contentsQuery.isError}
              onRetry={() => contentsQuery.refetch()}
              truncated={truncated}
              selected={selectedProduct}
              onSelect={handleProductSelect}
            />
          )}

          {selectedProduct && productOnMap && (
            <CardSection
              title={t('warehouseMap.productStock')}
              icon={PackageSearch}
              description={productOnMap.name}
            >
              <p className="text-sm text-foreground">
                {t('warehouseMap.productBins', { count: productOnMap.binsCount })}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('warehouseMap.unitsInBin', { count: productOnMap.totalQuantity })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('warehouseMap.hintsNote')}</p>
            </CardSection>
          )}

          {selectedProduct && !productOnMap && (
            <CardSection
              title={t('warehouseMap.productStock')}
              icon={PackageSearch}
              description={selectedProduct.name}
            >
              <p className="text-sm text-muted-foreground">{t('warehouseMap.noPlacements')}</p>
            </CardSection>
          )}

          {canViewRoutes && selectedBatchId !== null && (
            <CardSection
              title={t('warehouseMap.pickRoute')}
              icon={Route}
              description={`#${selectedBatchId}`}
            >
              {routeQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : route ? (
                <div className="space-y-1">
                  <p className="text-sm text-foreground">
                    {t('warehouseMap.routeStops', { count: route.stops.length })}
                  </p>
                  {route.unplacedCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t('warehouseMap.unplacedTasks', { count: route.unplacedCount })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
              )}
            </CardSection>
          )}

          {selectedBin ? (
            <BinDetailsPanel
              bin={selectedBin}
              parentBin={parentBin}
              routeStop={selectedRouteStop}
              binProducts={binProducts}
              binProductsReady={binProductsReady}
            />
          ) : (
            <CardSection title={t('warehouseMap.binDetails')} icon={Boxes}>
              <p className="text-sm text-muted-foreground">{t('warehouseMap.selectBinHint')}</p>
            </CardSection>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title={t('warehouseMap.discardLayout')}
        description={t('warehouseMap.discardLayoutConfirm')}
        confirmLabel={t('warehouseMap.discardLayout')}
        tone="default"
        onConfirm={confirmDiscardChanges}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t('warehouseMap.resetLayout')}
        description={t('warehouseMap.resetLayoutConfirm')}
        confirmLabel={t('warehouseMap.resetLayout')}
        tone="danger"
        onConfirm={confirmResetLayout}
      />
    </div>
  );
}
