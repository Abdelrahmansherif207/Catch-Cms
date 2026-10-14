import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  MapPin,
  PackageCheck,
  PackageSearch,
  Pencil,
  Ship,
  XCircle,
} from 'lucide-react';
import { PackageStatusBadge } from '@/features/packages/components/package-status-badge';
import type { PackingTask, FulfillmentPackage } from '../types/fulfillment.types';
import { pickingTaskRoutes } from '@/features/picking-tasks/routes/picking-task.routes';
import { packingTaskRoutes } from '@/features/packing-tasks/routes/packing-task.routes';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { DataErrorState } from '@/shared/components/data-state';
import { PageBackHeader } from '@/shared/components/page-header';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { fulfillmentRoutes } from '../routes/fulfillment.routes';
import { orderRoutes } from '@/features/orders/routes/order.routes';
import {
  useFulfillment,
  useCreatePickingTasks,
  useCreatePackingTask,
  useCompletePicking,
} from '../hooks/use-fulfillments';
import {
  CANCELLABLE_STATUSES,
  PACKING_CREATABLE_STATUS,
  PICKING_COMPLETABLE_STATUSES,
  SHIPPABLE_STATUS,
  TASK_CREATABLE_STATUSES,
  isFulfillmentStatus,
} from '../schemas/release.schema';
import { FulfillmentStatusBadge } from '../components/fulfillment-status-badge';
import { AssignFulfillmentDialog } from '../components/assign-fulfillment-dialog';
import { CancelFulfillmentDialog } from '../components/cancel-fulfillment-dialog';
import { CreateShipmentDialog } from '../components/create-shipment-dialog';
import { AssignPlacementDialog } from '../components/assign-placement-dialog';
import type {
  FulfillmentDetail,
  FulfillmentItem,
} from '../types/fulfillment.types';

interface FulfillmentDetailPageProps {
  id: number;
}

/**
 * Route entry: validates the numeric path param and renders the page.
 * Non-numeric segments can never match the route (server-side contract),
 * but stale edited URLs still land here — redirect them to the list.
 */
export function FulfillmentDetailRoute() {
  const { id } = useParams();
  if (!id || !/^\d+$/.test(id)) {
    window.location.replace(fulfillmentRoutes.list);
    return null;
  }
  return <FulfillmentDetailPage id={Number(id)} />;
}

export function FulfillmentDetailPage({ id }: FulfillmentDetailPageProps) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { data, isLoading, isError, refetch } = useFulfillment(id);

  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [placementItem, setPlacementItem] = useState<FulfillmentItem | null>(null);
  const createTasksMutation = useCreatePickingTasks();
  const createPackingTaskMutation = useCreatePackingTask();
  const completePickingMutation = useCompletePicking();

  const canManage = can(PERMISSIONS.fulfillments.manage);
  const canPick = can(PERMISSIONS.fulfillments.picking);
  const canPackExecute = can(PERMISSIONS.fulfillments.packingExecute);
  const canCancel = can(PERMISSIONS.fulfillments.cancel);
  const canShipment = can(PERMISSIONS.fulfillments.shipment);

  const detail = data?.data;

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isError) {
    return <DataErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || !detail) {
    return <DetailSkeleton />;
  }

  const status = isFulfillmentStatus(detail.status) ? detail.status : 'pending';

  // Status-driven action visibility — mirrors the backend guards so
  // operators never see an action the engine would refuse with 422.
  const showCreateTasks = canPick && TASK_CREATABLE_STATUSES.includes(status);
  const showCompletePicking = canManage && PICKING_COMPLETABLE_STATUSES.includes(status);
  const showStartPacking = canPackExecute && status === PACKING_CREATABLE_STATUS;
  const showAssign = canManage && status !== 'cancelled';
  const showCancel = canCancel && CANCELLABLE_STATUSES.includes(status);
  const showShipment = canShipment && status === SHIPPABLE_STATUS;

  const timeline = [
    { key: 'created_at', label: t('fulfillments.timeline.created') },
    { key: 'picking_started_at', label: t('fulfillments.timeline.pickingStarted') },
    { key: 'picking_completed_at', label: t('fulfillments.timeline.pickingCompleted') },
    { key: 'packing_started_at', label: t('fulfillments.timeline.packingStarted') },
    { key: 'packing_completed_at', label: t('fulfillments.timeline.packingCompleted') },
    { key: 'ready_to_ship_at', label: t('fulfillments.timeline.readyToShip') },
    { key: 'shipped_at', label: t('fulfillments.timeline.shipped') },
    { key: 'delivered_at', label: t('fulfillments.timeline.delivered') },
  ] as const;

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={detail.fulfillment_number}
        backTo={fulfillmentRoutes.list}
        backLabel={t('fulfillments.pageTitle')}
        description={
          detail.order
            ? t('fulfillments.detailSubtitle', { order: detail.order.order_number })
            : undefined
        }
        actions={
          <>
            {showShipment && (
              <Button onClick={() => setShipmentOpen(true)}>
                <Ship className="me-1.5 h-4 w-4" />
                {t('fulfillments.shipmentAction')}
              </Button>
            )}
            {showCreateTasks && (
              <Button onClick={() => createTasksMutation.mutate(detail.id)}>
                <ClipboardList className="me-1.5 h-4 w-4" />
                {t('fulfillments.createTasks')}
              </Button>
            )}
            {showCompletePicking && (
              <Button onClick={() => completePickingMutation.mutate(detail.id)}>
                <CheckCircle2 className="me-1.5 h-4 w-4" />
                {t('fulfillments.completePicking')}
              </Button>
            )}
            {showStartPacking && (
              <Button
                onClick={() => createPackingTaskMutation.mutate(detail.id)}
                disabled={createPackingTaskMutation.isPending}
              >
                <PackageCheck className="me-1.5 h-4 w-4" />
                {createPackingTaskMutation.isPending
                  ? t('fulfillments.startingPacking')
                  : t('fulfillments.startPacking')}
              </Button>
            )}
            {showAssign && (
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                <Pencil className="me-1.5 h-4 w-4" />
                {t('fulfillments.assignAction')}
              </Button>
            )}
            {showCancel && (
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                <XCircle className="me-1.5 h-4 w-4" />
                {t('fulfillments.cancelAction')}
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FulfillmentStatusBadge status={status} />
        {detail.warehouse && (
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm">
            {detail.warehouse.name} ({detail.warehouse.code})
          </span>
        )}
        {detail.order && (
          <Link
            to={orderRoutes.detail(detail.order.id)}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/70"
          >
            {detail.order.order_number}
            <span className="text-xs text-muted-foreground">· {detail.order.status}</span>
          </Link>
        )}
        {detail.assigned_user ? (
          <span className="rounded-full bg-muted px-3 py-1 text-sm">
            {detail.assigned_user.name}
          </span>
        ) : null}
        {detail.cancel_source ? (
          <span className="rounded-full bg-destructive-soft px-3 py-1 text-sm text-destructive">
            {t('fulfillments.cancelSource', { source: detail.cancel_source })}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 text-sm font-semibold">{t('fulfillments.lifecycleTitle')}</h2>
          <ol className="space-y-2.5">
            {timeline.map((entry) => (
              <TimelineRow
                key={entry.key}
                label={entry.label}
                value={(detail as unknown as Record<string, string | null>)[entry.key] ?? null}
              />
            ))}
            {detail.cancelled_at && (
              <TimelineRow
                label={t('fulfillments.timeline.cancelled')}
                value={detail.cancelled_at}
              />
            )}
          </ol>
          {detail.notes && (
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">{detail.notes}</p>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 text-sm font-semibold">{t('fulfillments.itemsTitle')}</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-start">#</th>
                  <th className="px-3 py-2 text-start">{t('fulfillments.itemProduct')}</th>
                  <th className="px-3 py-2 text-start">{t('fulfillments.itemQty')}</th>
                  <th className="px-3 py-2 text-start">{t('fulfillments.itemPicked')}</th>
                  <th className="px-3 py-2 text-start">{t('common.status')}</th>
                  <th className="px-2 py-2 text-end">{t('fulfillments.placement')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {detail.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  detail.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      canManage={canManage}
                      onAssignPlacement={() => setPlacementItem(item)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CountCard label={t('fulfillments.pickingTasks')} rows={detail.picking_tasks.length} />
        <CountCard label={t('fulfillments.packingTasks')} rows={detail.packing_tasks.length} />
        <CountCard label={t('fulfillments.packages')} rows={detail.packages.length} />
        <CountCard label={t('fulfillments.shipments')} rows={detail.shipments.length} />
      </div>

      {detail.picking_tasks.length > 0 && (
        <PickingTasksMiniTable tasks={detail.picking_tasks} />
      )}

      {detail.packing_tasks.length > 0 && (
        <PackingTasksMiniTable tasks={detail.packing_tasks} />
      )}

      {detail.packages.length > 0 && <PackagesMiniTable packages={detail.packages} />}

      <AssignFulfillmentDialog
        fulfillment={detail}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onSuccess={refresh}
      />
      <CancelFulfillmentDialog
        fulfillment={detail}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onSuccess={refresh}
      />
      <CreateShipmentDialog
        fulfillment={detail}
        open={shipmentOpen}
        onOpenChange={setShipmentOpen}
        onSuccess={refresh}
      />
      {placementItem && (
        <AssignPlacementDialog
          item={placementItem}
          warehouseId={detail.warehouse_id}
          open
          onOpenChange={(open) => {
            if (!open) setPlacementItem(null);
          }}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string | null }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span
        className={
          value
            ? 'flex h-5 w-5 items-center justify-center rounded-full bg-success-soft'
            : 'flex h-5 w-5 items-center justify-center rounded-full bg-muted'
        }
      >
        {value ? <CheckCircle2 className="h-3 w-3 text-success" /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span>
      <span className="font-mono text-xs whitespace-nowrap">
        {value ? formatDate(value) : '—'}
      </span>
    </li>
  );
}

function ItemRow({
  item,
  canManage,
  onAssignPlacement,
}: {
  item: FulfillmentItem;
  canManage: boolean;
  onAssignPlacement: () => void;
}) {
  const { t } = useTranslation();
  const pinned = item.product_location_id !== null;

  return (
    <tr>
      <td className="px-3 py-2 font-mono text-xs">{item.id}</td>
      <td className="px-3 py-2">#{item.product_id}</td>
      <td className="px-3 py-2">{item.quantity}</td>
      <td className="px-3 py-2">{item.quantity_picked}</td>
      <td className="px-3 py-2">{item.status}</td>
      <td className="px-2 py-2 text-end">
        {/* Placement is ALWAYS explicit — unplaced rows carry a warning
            badge, pinned rows show the pinned id; the assign/re-assign
            action is offered to managers in BOTH cases (the endpoint has
            no state guard, so re-pinning is legal). */}
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium',
            pinned
              ? 'bg-success-soft text-success'
              : 'bg-warning-soft text-warning'
          )}
        >
          {pinned ? (
            <>#{item.product_location_id}</>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3" />
              {t('fulfillments.needsPlacement')}
            </>
          )}
        </span>
        {canManage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ms-1.5"
            onClick={onAssignPlacement}
          >
            <MapPin className="me-1 h-3.5 w-3.5" />
            {pinned
              ? t('fulfillments.changePlacement')
              : t('fulfillments.assignPlacement')}
          </Button>
        )}
      </td>
    </tr>
  );
}

function CountCard({ label, rows }: { label: string; rows: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{rows}</p>
    </div>
  );
}

/**
 * Live picking-task rows for this fulfillment — each row links to the
 * operator pick screen instead of being a count-card dead end.
 */
function PickingTasksMiniTable({
  tasks,
}: {
  tasks: FulfillmentDetail['picking_tasks'];
}) {
  const { t } = useTranslation();
  const canPick = usePermissions().can(PERMISSIONS.fulfillments.picking);

  if (!canPick) return null;

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card">
      <h2 className="mb-3 text-sm font-semibold">{t('fulfillments.pickingTasks')}</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">#</th>
              <th className="px-3 py-2 text-start">{t('common.status')}</th>
              <th className="px-3 py-2 text-start">{t('fulfillments.itemQty')}</th>
              <th className="px-3 py-2 text-start">{t('fulfillments.itemPicked')}</th>
              <th className="px-3 py-2 text-start">{t('fulfillments.placement')}</th>
              <th className="px-2 py-2 text-end" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-3 py-2 font-mono text-xs">#{task.id}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {task.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{task.quantity_to_pick}</td>
                <td className="px-3 py-2 font-mono text-xs">{task.quantity_picked}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {task.product_location_id === null ? '—' : '#' + task.product_location_id}
                </td>
                <td className="px-2 py-2 text-end">
                  <Link
                    to={pickingTaskRoutes.detail(task.id)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <PackageSearch className="h-3.5 w-3.5" />
                    {t('fulfillments.viewPickingTask')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Live packing-task rows for this fulfillment — mirrors the picking table
 * shape (slim {id, status, packing_station_id, assigned_to} payload).
 */
function PackingTasksMiniTable({ tasks }: { tasks: PackingTask[] }) {
  const { t } = useTranslation();
  const canView = usePermissions().can(PERMISSIONS.fulfillments.view);

  if (!canView) return null;

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card">
      <h2 className="mb-3 text-sm font-semibold">{t('fulfillments.packingTasks')}</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">#</th>
              <th className="px-3 py-2 text-start">{t('common.status')}</th>
              <th className="px-3 py-2 text-start">{t('packingTasks.station')}</th>
              <th className="px-3 py-2 text-start">{t('packingTasks.assignee')}</th>
              <th className="px-2 py-2 text-end" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-3 py-2 font-mono text-xs">#{task.id}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {task.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {task.packing_station_id === null ? '—' : '#' + task.packing_station_id}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {task.assigned_to === null ? '—' : '#' + task.assigned_to}
                </td>
                <td className="px-2 py-2 text-end">
                  <Link
                    to={packingTaskRoutes.detail(task.id)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <PackageCheck className="h-3.5 w-3.5" />
                    {t('fulfillments.viewPackingTask')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Slim package rows for this fulfillment — the physical boxes (the full
 * management surface lives on the packing task detail screen).
 */
function PackagesMiniTable({ packages }: { packages: FulfillmentPackage[] }) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card">
      <h2 className="mb-3 text-sm font-semibold">{t('fulfillments.packages')}</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">{t('packages.package')}</th>
              <th className="px-3 py-2 text-start">{t('common.status')}</th>
              <th className="px-2 py-2 text-start">{t('packingTasks.task')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {packages.map((pkg) => (
              <tr key={pkg.id}>
                <td className="px-3 py-2 font-mono text-xs">{pkg.package_number}</td>
                <td className="px-3 py-2">
                  <PackageStatusBadge status={pkg.status} />
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {pkg.packing_task_id === null ? '—' : '#' + pkg.packing_task_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DetailSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4" aria-busy="true" aria-label={t('common.loading')}>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-6 w-96" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type { FulfillmentDetail };
