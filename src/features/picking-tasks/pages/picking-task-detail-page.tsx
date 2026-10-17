import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Hand,
  MapPin,
  PackageSearch,
  PlayCircle,
  RotateCcw,
  ScanBarcode,
  SkipForward,
  Waves,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { DataErrorState } from '@/shared/components/data-state';
import { PageBackHeader } from '@/shared/components/page-header';
import { fulfillmentRoutes } from '@/features/fulfillments/routes/fulfillment.routes';
import {
  usePickingTask,
  useClaimPickingTask,
  useReleasePickingClaim,
} from '../hooks/use-picking-tasks';
import { isTerminalTask, type PickingTaskDetail } from '../types/picking-task.types';
import { taskProgress } from '../schemas/picking-task.schema';
import { pickingTaskRoutes } from '../routes/picking-task.routes';
import { batchRoutes } from '@/features/batches/routes/batch.routes';
import { useBatch, useBatchNextTask } from '@/features/batches/hooks/use-batches';
import { hasNextTask } from '@/features/batches/types/batch.types';
import { sequencePosition } from '@/features/batches/schemas/batch.schema';
import { PickingTaskStatusBadge } from '../components/picking-task-status-badge';
import { RecordPickDialog } from '../components/record-pick-dialog';
import { ConfirmPickDialog } from '../components/confirm-pick-dialog';
import { SkipTaskDialog } from '../components/skip-task-dialog';
import { ReallocateTaskDialog } from '../components/reallocate-task-dialog';

/**
 * Route entry: validates the numeric path param and renders the page.
 * Non-numeric segments can never match the route (whereNumber contract),
 * but stale edited URLs still land here — bounce them to the list.
 */
export function PickingTaskDetailRoute() {
  const { id } = useParams();
  if (!id || !/^\d+$/.test(id)) {
    window.location.replace(pickingTaskRoutes.list);
    return null;
  }
  return <PickingTaskDetailPage id={Number(id)} />;
}

export function PickingTaskDetailPage({ id }: { id: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = usePickingTask(id);
  const claimMutation = useClaimPickingTask();
  const releaseMutation = useReleasePickingClaim();

  const detail = data?.data;

  // Batch context (shared cache with the batch pages) — only fetched
  // when this task belongs to a wave batch.
  const batchQuery = useBatch(detail?.batch_id ?? undefined);
  const batch = batchQuery.data?.data ?? null;
  const batchActive =
    batch !== null && batch.status !== 'completed' && batch.status !== 'cancelled';

  // Advance loop: the engine's next pending task once this one is picked.
  // A cached next-task can still name THIS task right after the pick —
  // treating it as "no next" shows the wave-done branch instead of a
  // self-navigating no-op button.
  const nextQuery = useBatchNextTask(batchActive ? (detail?.batch_id ?? undefined) : undefined);
  const nextTask =
    nextQuery.data &&
    hasNextTask(nextQuery.data) &&
    nextQuery.data.data.id !== id
      ? nextQuery.data.data
      : null;

  const [pickOpen, setPickOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [reallocateOpen, setReallocateOpen] = useState(false);
  // Replay protection: monotonic device op counter (op_seq contract) —
  // advanced inside each pick/confirm submit handler, never during render.
  const opSeqRef = useRef(0);

  const bumpOpSeq = () => {
    opSeqRef.current += 1;
    return opSeqRef.current;
  };

  if (isError) {
    return <DataErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || !detail) {
    return <DetailSkeleton />;
  }

  const terminal = isTerminalTask(detail.status);
  const progress = taskProgress(detail);
  const complete = progress.remaining === 0 && progress.picked > 0;

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={t('pickingTasks.detailTitle', { id: detail.id })}
        backTo={pickingTaskRoutes.list}
        backLabel={t('pickingTasks.pageTitle')}
        description={
          detail.fulfillment
            ? t('pickingTasks.detailSubtitle', { number: detail.fulfillment.fulfillment_number })
            : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <PickingTaskStatusBadge status={detail.status} />
        {detail.fulfillment && (
          <Link
            to={fulfillmentRoutes.detail(detail.fulfillment.id)}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/70"
          >
            {detail.fulfillment.fulfillment_number}
            <span className="text-xs text-muted-foreground">
              · {detail.fulfillment.status}
            </span>
          </Link>
        )}
        {detail.order_id != null && (
          <span className="rounded-full bg-muted px-3 py-1 font-mono text-sm">
            {t('pickingTasks.order')} #{detail.order_id}
          </span>
        )}
        {detail.claimed_by !== null && (
          <span className="rounded-full bg-info-soft px-3 py-1 text-sm text-info">
            {t('pickingTasks.claimedByChip', { id: detail.claimed_by })}
          </span>
        )}
      </div>

      {/* Batch arrival banner — "you are here" in the wave. */}
      {detail.batch_id !== null && batch && (
        <BatchContextBanner
          batchNumber={batch.batch_number}
          batchId={batch.id}
          position={sequencePosition(batch.tasks, detail.id)}
        />
      )}

      {/* Progress card — picked/total as a plain-language bar. */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('pickingTasks.progress')}</p>
            <p className="text-2xl font-bold font-mono">
              {progress.picked} / {progress.total}
            </p>
          </div>
          {complete ? (
            <span className="flex items-center gap-2 rounded-full bg-success-soft px-4 py-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" />
              {t('pickingTasks.fullyPicked')}
            </span>
          ) : null}
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{
              width:
                progress.total > 0
                  ? Math.min((progress.picked / progress.total) * 100, 100) + '%'
                  : '0%',
            }}
          />
        </div>
      </section>

      {/* Shelf card — where to walk to. */}
      <section
        className={cn(
          'rounded-2xl border bg-card p-4 shadow-card',
          !detail.location && !terminal && 'border-warning'
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-soft">
              <MapPin className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('pickingTasks.shelf')}</p>
              {detail.location ? (
                <>
                  <p className="text-xl font-bold font-mono">{detail.location.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.location.name}
                    {detail.location.barcode
                      ? ' · ' + t('pickingTasks.shelfBarcode') + ' ' + detail.location.barcode
                      : ''}
                  </p>
                </>
              ) : (
                <p className="flex items-center gap-1.5 text-xl font-bold text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  {t('pickingTasks.noShelf')}
                </p>
              )}
            </div>
          </div>
          {!terminal && (
            <Button variant="outline" onClick={() => setReallocateOpen(true)}>
              <ArrowLeftRight className="me-1.5 h-4 w-4" />
              {t('pickingTasks.reallocateAction')}
            </Button>
          )}
        </div>
      </section>

      {/* Action deck — claim first, then the pick flow. */}
      {!terminal && (
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          {detail.claimed_by === null ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {t('pickingTasks.unclaimedHint')}
              </p>
              <Button
                onClick={() => claimMutation.mutate({ id: detail.id })}
                disabled={claimMutation.isPending}
              >
                <PlayCircle className="me-1.5 h-4 w-4" />
                {claimMutation.isPending
                  ? t('pickingTasks.claiming')
                  : t('pickingTasks.claimAction')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Button
                size="lg"
                className="h-auto flex-col gap-1 py-4"
                onClick={() => setPickOpen(true)}
                disabled={complete}
              >
                <Hand className="h-5 w-5" />
                {t('pickingTasks.pickNow')}
                <span className="text-xs opacity-80">
                  {t('pickingTasks.pickNowHint', { remaining: progress.remaining })}
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-auto flex-col gap-1 py-4"
                onClick={() => setConfirmOpen(true)}
                disabled={complete}
              >
                <ScanBarcode className="h-5 w-5" />
                {t('pickingTasks.confirmScan')}
                <span className="text-xs opacity-80">
                  {t('pickingTasks.confirmScanHint')}
                </span>
              </Button>
            </div>
          )}

          {detail.claimed_by !== null && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <Button variant="outline" size="sm" onClick={() => setSkipOpen(true)}>
                <SkipForward className="me-1.5 h-4 w-4" />
                {t('pickingTasks.skipAction')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => releaseMutation.mutate(detail.id)}
                disabled={releaseMutation.isPending}
              >
                <RotateCcw className="me-1.5 h-4 w-4" />
                {t('pickingTasks.releaseAction')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setReallocateOpen(true)}>
                <ArrowLeftRight className="me-1.5 h-4 w-4" />
                {t('pickingTasks.wrongShelf')}
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Advance loop — picked task inside an active batch: the operator
          walks the wave without navigating back manually. */}
      {detail.status === 'picked' && detail.batch_id !== null && batchActive && (
        <section className="rounded-2xl border-2 border-primary/40 bg-card p-4 shadow-card">
          {nextTask ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">
                <span className="font-semibold">{t('pickingTasks.nextTaskTitle')}</span>
                <br />
                <span className="text-muted-foreground">
                  {t('pickingTasks.nextTaskDescription', { id: nextTask.id })}
                </span>
              </p>
              <Button size="lg" onClick={() => navigate(pickingTaskRoutes.detail(nextTask.id))}>
                {t('pickingTasks.nextTaskAction')}
                <ArrowRight className="ms-1.5 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-success">
                <CheckCircle2 className="h-5 w-5" />
                {t('pickingTasks.batchWaveDone')}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate(batchRoutes.detail(detail.batch_id as number))}
              >
                {t('pickingTasks.backToBatchFinish')}
                <ArrowRight className="ms-1.5 h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Audit block — op watermark + scan log + notes. */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4" />
            {t('pickingTasks.auditTitle')}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pickingTasks.opSeq')}</span>
              <span className="font-mono">{detail.op_seq}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pickingTasks.claimedAt')}</span>
              <span className="font-mono text-xs">
                {detail.claimed_at ? formatDate(detail.claimed_at) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pickingTasks.leaseExpires')}</span>
              <span className="font-mono text-xs">
                {detail.claim_expires_at ? formatDate(detail.claim_expires_at) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pickingTasks.pickedAt')}</span>
              <span className="font-mono text-xs">
                {detail.picked_at ? formatDate(detail.picked_at) : '—'}
              </span>
            </div>
          </div>
          {detail.notes && (
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              {t('pickingTasks.taskNotes')}: {detail.notes}
            </p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <PackageSearch className="h-4 w-4" />
            {t('pickingTasks.scanLogTitle')}
          </h2>
          {detail.scan_log.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('pickingTasks.scanLogEmpty')}</p>
          ) : (
            <ul className="space-y-1.5">
              {detail.scan_log.map((entry, index) => (
                <li key={index} className="rounded-lg border px-2.5 py-1.5 font-mono text-xs">
                  {JSON.stringify(entry)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {pickOpen && (
        <RecordPickDialog task={detail} onOpSeq={bumpOpSeq} open onOpenChange={setPickOpen} />
      )}
      {confirmOpen && (
        <ConfirmPickDialog task={detail} onOpSeq={bumpOpSeq} open onOpenChange={setConfirmOpen} />
      )}
      {skipOpen && <SkipTaskDialog task={detail} open onOpenChange={setSkipOpen} />}
      {reallocateOpen && (
        <ReallocateTaskDialog task={detail} open onOpenChange={setReallocateOpen} />
      )}
    </div>
  );
}

/**
 * Arrival highlight: the task IS the page, so the banner carries the
 * wave context — "Task 2 of 5 in BATCH-…" with a way back to the batch.
 */
function BatchContextBanner({
  batchNumber,
  batchId,
  position,
}: {
  batchNumber: string;
  batchId: number;
  position: { index: number; total: number };
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft/40 px-4 py-3">
      <p className="flex items-center gap-2.5 text-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-mono text-sm font-bold text-white">
          <Waves className="h-4 w-4" />
        </span>
        <span>
          <span className="block font-semibold">
            {t('pickingTasks.batchWavePosition', {
              index: position.index,
              total: position.total,
            })}
          </span>
          <span className="block font-mono text-xs text-muted-foreground">
            {batchNumber}
          </span>
        </span>
      </p>
      <Link
        to={batchRoutes.detail(batchId)}
        className="text-xs font-medium text-primary hover:underline"
      >
        {t('pickingTasks.backToBatch')}
      </Link>
    </div>
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

export type { PickingTaskDetail };
