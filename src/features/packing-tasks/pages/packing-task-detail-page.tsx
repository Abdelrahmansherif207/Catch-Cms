import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  PlayCircle,
  Scale,
  UserPlus,
  Warehouse,
  XCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { DataErrorState } from '@/shared/components/data-state';
import { PageBackHeader } from '@/shared/components/page-header';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { fulfillmentRoutes } from '@/features/fulfillments/routes/fulfillment.routes';
import { useFulfillment } from '@/features/fulfillments/hooks/use-fulfillments';
import {
  usePackingTask,
  useStartPackingTask,
} from '../hooks/use-packing-tasks';
import {
  ASSIGNABLE_STATUSES,
  CANCELLABLE_STATUSES,
  PACKABLE_STATUSES,
  STARTABLE_STATUSES,
  VERIFIABLE_STATUSES,
  type PackingTaskDetail,
} from '../types/packing-task.types';
import { packingTaskRoutes } from '../routes/packing-task.routes';
import { PackingTaskStatusBadge } from '../components/packing-task-status-badge';
import { PackagesPanel } from '../components/packages-panel';
import { AssignPackingTaskDialog } from '../components/assign-packing-task-dialog';
import { PackPackingDialog } from '../components/pack-packing-dialog';
import { VerifyPackingDialog } from '../components/verify-packing-dialog';
import { CancelPackingTaskDialog } from '../components/cancel-packing-task-dialog';

/**
 * Route entry: validates the numeric path param and renders the page.
 * Non-numeric segments can never match the route (whereNumber contract),
 * but stale edited URLs still land here — bounce them to the list.
 */
export function PackingTaskDetailRoute() {
  const { id } = useParams();
  if (!id || !/^\d+$/.test(id)) {
    window.location.replace(packingTaskRoutes.list);
    return null;
  }
  return <PackingTaskDetailPage id={Number(id)} />;
}

export function PackingTaskDetailPage({ id }: { id: number }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = usePackingTask(id);
  const startMutation = useStartPackingTask();
  const rawPermissions = useAuthStore((s) => s.user?.permissions ?? []);
  const canExecute = rawPermissions.includes(PERMISSIONS.fulfillments.packingExecute);
  const canComplete = rawPermissions.includes(PERMISSIONS.fulfillments.packingComplete);
  const canManage = rawPermissions.includes(PERMISSIONS.fulfillments.manage);

  const [assignOpen, setAssignOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const detail = data?.data;

  const { data: fulfillmentResponse } = useFulfillment(detail?.fulfillment_id);
  const fulfillment = fulfillmentResponse?.data;

  if (isError) {
    return <DataErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || !detail) {
    return <DetailSkeleton />;
  }

  const status = detail.status;
  const canAssign =
    canExecute && ASSIGNABLE_STATUSES.includes(status as (typeof ASSIGNABLE_STATUSES)[number]);
  const canStart =
    canExecute && STARTABLE_STATUSES.includes(status as (typeof STARTABLE_STATUSES)[number]);
  const canPack =
    canComplete && PACKABLE_STATUSES.includes(status as (typeof PACKABLE_STATUSES)[number]);
  const canVerify =
    canComplete && VERIFIABLE_STATUSES.includes(status as (typeof VERIFIABLE_STATUSES)[number]);
  const canCancelById =
    canManage && CANCELLABLE_STATUSES.includes(status as (typeof CANCELLABLE_STATUSES)[number]);

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={t('packingTasks.detailTitle', { id: detail.id })}
        backTo={packingTaskRoutes.list}
        backLabel={t('packingTasks.pageTitle')}
        description={
          fulfillment
            ? t('packingTasks.detailSubtitle', { number: fulfillment.fulfillment_number })
            : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <PackingTaskStatusBadge status={detail.status} />
        {fulfillment ? (
          <Link
            to={fulfillmentRoutes.detail(fulfillment.id)}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/70"
          >
            {fulfillment.fulfillment_number}
            <span className="text-xs text-muted-foreground">
              · {fulfillment.status}
            </span>
          </Link>
        ) : (
          <span className="rounded-full bg-muted px-3 py-1 font-mono text-sm">
            {t('packingTasks.fulfillment')} #{detail.fulfillment_id}
          </span>
        )}
        {detail.assigned_to !== null && (
          <span className="rounded-full bg-info-soft px-3 py-1 text-sm text-info">
            {t('packingTasks.assigneeChip', { id: detail.assigned_to })}
          </span>
        )}
        {fulfillment?.order && (
          <span className="rounded-full bg-muted px-3 py-1 font-mono text-sm">
            {fulfillment.order.order_number}
          </span>
        )}
      </div>

      {/* Station card — where the packing happens. */}
      <section
        className={cn(
          'rounded-2xl border bg-card p-4 shadow-card',
          !detail.station && canAssign && 'border-warning'
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-soft">
              <Warehouse className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('packingTasks.stationCard')}</p>
              {detail.station ? (
                <>
                  <p className="text-xl font-bold font-mono">{detail.station.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.station.name} · #{detail.station.warehouse_id}
                  </p>
                </>
              ) : (
                <p className="flex items-center gap-1.5 text-xl font-bold text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  {t('packingTasks.noStation')}
                </p>
              )}
            </div>
          </div>
          {canAssign && (
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <UserPlus className="me-1.5 h-4 w-4" />
              {t('packingTasks.assignAction')}
            </Button>
          )}
        </div>
      </section>

      {/* Action deck — the state machine, one action per stage. */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        {canStart ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t('packingTasks.assignDescription')}
            </p>
            <Button
              onClick={() => startMutation.mutate(detail.id)}
              disabled={startMutation.isPending}
            >
              <PlayCircle className="me-1.5 h-4 w-4" />
              {startMutation.isPending
                ? t('packingTasks.starting')
                : t('packingTasks.startAction')}
            </Button>
          </div>
        ) : null}
        {canPack ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t('packingTasks.packDescription')}
            </p>
            <Button onClick={() => setPackOpen(true)}>
              <Scale className="me-1.5 h-4 w-4" />
              {t('packingTasks.packActionNow')}
            </Button>
          </div>
        ) : null}
        {canVerify ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t('packingTasks.verifyDescription')}
            </p>
            <Button onClick={() => setVerifyOpen(true)}>
              <BadgeCheck className="me-1.5 h-4 w-4" />
              {t('packingTasks.verifyAction')}
            </Button>
          </div>
        ) : null}

        {canCancelById && (
          <div className="flex items-center gap-2 border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
              <XCircle className="me-1.5 h-4 w-4" />
              {t('packingTasks.cancelAction')}
            </Button>
          </div>
        )}

        {!canStart && !canPack && !canVerify && !canCancelById && (
          <p className="text-sm text-muted-foreground">
            {t('common.noData')}
          </p>
        )}
      </section>

      {/* Packages panel — the packer's boxes, independent of task state. */}
      {fulfillment && (
        <PackagesPanel fulfillmentId={fulfillment.id} items={fulfillment.items} />
      )}

      {/* Lifecycle + pack details. */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4" />
            {t('packingTasks.lifecycleTitle')}
          </h2>
          <div className="space-y-2 text-sm">
            <LifecycleRow label={t('packingTasks.assignedAt')} value={detail.assigned_at} />
            <LifecycleRow label={t('packingTasks.startedAt')} value={detail.started_at} />
            <LifecycleRow label={t('packingTasks.packedAt')} value={detail.packed_at} />
            <LifecycleRow label={t('packingTasks.verifiedAt')} value={detail.verified_at} />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Scale className="h-4 w-4" />
            {t('packingTasks.packDetailsTitle')}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('packingTasks.weight')}</span>
              <span className="font-mono font-semibold">
                {detail.weight === null ? '—' : detail.weight}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('packingTasks.dimensions')}</span>
              <span className="font-mono text-xs">
                {detail.dimensions ? humanizeDimensions(detail.dimensions) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('packingTasks.materials')}</span>
              <span className="font-mono text-xs text-end max-w-[60%] break-words">
                {detail.package_materials && detail.package_materials.length > 0
                  ? detail.package_materials.join(', ')
                  : '—'}
              </span>
            </div>
          </div>
          {detail.notes && (
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              {t('packingTasks.taskNotes')}: {detail.notes}
            </p>
          )}
        </div>
      </section>

      {assignOpen && (
        <AssignPackingTaskDialog
          task={detail}
          warehouseId={fulfillment?.warehouse_id}
          open
          onOpenChange={setAssignOpen}
        />
      )}
      {packOpen && <PackPackingDialog task={detail} open onOpenChange={setPackOpen} />}
      {verifyOpen && <VerifyPackingDialog task={detail} open onOpenChange={setVerifyOpen} />}
      {cancelOpen && (
        <CancelPackingTaskDialog task={detail} open onOpenChange={setCancelOpen} />
      )}
    </div>
  );
}

function LifecycleRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{value ? formatDate(value) : '—'}</span>
    </div>
  );
}

function humanizeDimensions(dimensions: Record<string, number>): string {
  const parts = Object.entries(dimensions).map(([key, value]) => `${key} ${value}`);
  return parts.join(' × ');
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

export type { PackingTaskDetail };
