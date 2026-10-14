import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { DataErrorState } from '@/shared/components/data-state';
import { PageBackHeader } from '@/shared/components/page-header';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { pickingTaskRoutes } from '@/features/picking-tasks/routes/picking-task.routes';
import { BATCH_PERMISSIONS } from '../permissions/batch.permissions';
import {
  useBatch,
  useBatchNextTask,
  useStartBatch,
  useCompleteBatch,
  useRefreshBatchProgress,
} from '../hooks/use-batches';
import {
  batchProgress,
  openBatchTasks,
  skippedBatchTasks,
} from '../schemas/batch.schema';
import { hasNextTask, type BatchDetail, type BatchTaskRow } from '../types/batch.types';
import { batchRoutes } from '../routes/batch.routes';
import { BatchStatusBadge } from '../components/batch-status-badge';
import { BatchLifecycleStepper } from '../components/batch-lifecycle-stepper';
import { BatchHelpDialog } from '../components/batch-help-dialog';
import { AssignBatchDialog } from '../components/assign-batch-dialog';
import { CancelBatchDialog } from '../components/cancel-batch-dialog';
import { RetrySkippedDialog } from '../components/retry-skipped-dialog';

/**
 * Route entry: validates the numeric path param and renders the page.
 * Non-numeric segments can never match the route (whereNumber contract),
 * but stale edited URLs still land here — bounce them to the list.
 */
export function BatchDetailRoute() {
  const { id } = useParams();
  if (!id || !/^\d+$/.test(id)) {
    window.location.replace(batchRoutes.list);
    return null;
  }
  return <BatchDetailPage id={Number(id)} />;
}

export function BatchDetailPage({ id }: { id: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rawPermissions = useAuthStore((s) => s.user?.permissions ?? []);
  const canOperate = rawPermissions.includes(BATCH_PERMISSIONS.operate);
  const canManage = rawPermissions.includes(BATCH_PERMISSIONS.manage);

  const { data, isLoading, isError, refetch } = useBatch(id);
  const detail = data?.data;
  const terminal = detail ? detail.status === 'completed' || detail.status === 'cancelled' : false;

  const nextQuery = useBatchNextTask(id, { poll: !terminal });
  const startMutation = useStartBatch();
  const completeMutation = useCompleteBatch();
  const refreshMutation = useRefreshBatchProgress();

  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);

  if (isError) {
    return <DataErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || !detail) {
    return <DetailSkeleton />;
  }

  const progress = batchProgress(detail);
  const openTasks = openBatchTasks(detail.tasks);
  const skipped = skippedBatchTasks(detail.tasks);
  const nextTask = nextQuery.data && hasNextTask(nextQuery.data) ? nextQuery.data.data : null;

  // Exactly ONE primary action per state — operators never guess.
  const primaryAction =
    detail.status === 'pending' && canOperate ? (
      <Button size="lg" onClick={() => setAssignOpen(true)}>
        <UserCheck className="me-1.5 h-4 w-4" />
        {t('batches.giveToWorker')}
      </Button>
    ) : detail.status === 'assigned' && canOperate ? (
      <Button
        size="lg"
        onClick={() => startMutation.mutate(detail.id)}
        disabled={startMutation.isPending}
      >
        <PlayCircle className="me-1.5 h-4 w-4" />
        {startMutation.isPending ? t('batches.starting') : t('batches.beginPicking')}
      </Button>
    ) : detail.status === 'picking' && canOperate ? (
      <Button
        size="lg"
        onClick={() => completeMutation.mutate(detail.id)}
        disabled={completeMutation.isPending}
      >
        <CheckCircle2 className="me-1.5 h-4 w-4" />
        {completeMutation.isPending ? t('batches.completing') : t('batches.finishBatch')}
      </Button>
    ) : null;

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={detail.batch_number}
        backTo={batchRoutes.list}
        backLabel={t('batches.pageTitle')}
        description={t('batches.detailSubtitle', {
          picked: progress.picked,
          total: progress.total,
        })}
        actions={<BatchHelpDialog />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <BatchStatusBadge status={detail.status} />
        <span className="rounded-full bg-muted px-3 py-1 text-sm uppercase">
          {t('batches.typeWave')}
        </span>
        {detail.assigned_to !== null ? (
          <span className="rounded-full bg-info-soft px-3 py-1 text-sm text-info">
            {t('batches.assignedToChip', { id: detail.assigned_to })}
          </span>
        ) : (
          <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            {t('batches.unassigned')}
          </span>
        )}
      </div>

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <BatchLifecycleStepper status={detail.status} />
      </section>

      {/* Progress card — picked/total as a plain-language bar. */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('batches.progress')}</p>
            <p className="font-mono text-2xl font-bold">
              {progress.picked} / {progress.total}
            </p>
          </div>
          <p className="font-mono text-lg text-muted-foreground">
            {Math.round(progress.percent)}%
          </p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: progress.percent + '%' }}
          />
        </div>
      </section>

      {/* Next-up hero — the engine's authority on what comes next. */}
      {!terminal && (
        <section className="rounded-2xl border-2 border-primary/40 bg-card p-4 shadow-card">
          {nextTask ? (
            <NextTaskCard next={nextTask} />
          ) : (
            <NextTaskEmpty
              openCount={openTasks.length}
              skippedCount={skipped.length}
              canOperate={canOperate}
              onComplete={() => completeMutation.mutate(detail.id)}
              completing={completeMutation.isPending}
              onRetry={() => setRetryOpen(true)}
            />
          )}
        </section>
      )}

      {/* Sequence ladder — "you are here" dots for every position. */}
      {detail.tasks.length > 0 && (
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 text-sm font-semibold">{t('batches.ladderTitle')}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {orderedTasks(detail.tasks).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate(pickingTaskRoutes.detail(task.id))}
                title={'#' + task.id + ' · ' + task.status}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 font-mono text-xs font-bold transition-colors',
                  task.status === 'picked' && 'border-success bg-success text-white',
                  task.status === 'pending' &&
                    nextTask?.id === task.id &&
                    'animate-pulse border-primary bg-primary text-white',
                  task.status === 'pending' &&
                    nextTask?.id !== task.id &&
                    'border-muted bg-muted text-muted-foreground',
                  (task.status === 'assigned' || task.status === 'picking') &&
                    'border-info bg-info-soft text-info',
                  task.status === 'skipped' &&
                    'border-muted bg-muted text-muted-foreground line-through',
                  task.status === 'cancelled' && 'border-destructive bg-destructive-soft text-destructive'
                )}
              >
                {task.sequence ?? '·'}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sequence-ordered task cards — each deep-links to its pick screen. */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 text-sm font-semibold">
          {t('batches.tasksTitle', { count: detail.tasks.length })}
        </h2>
        {detail.tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t('batches.noTasks')}
          </p>
        ) : (
          <div className="space-y-2">
            {orderedTasks(detail.tasks).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate(pickingTaskRoutes.detail(task.id))}
                className={cn(
                  'flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-start hover:bg-muted/40',
                  nextTask?.id === task.id && 'border-primary/60 bg-primary-soft/30'
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold">
                    {task.sequence ?? '·'}
                  </span>
                  <span className="font-mono text-sm font-medium">#{task.id}</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {task.status}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">
                    {Number(task.quantity_picked)}/{Number(task.quantity_to_pick)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-primary">
                    {t('batches.openTask')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Contextual action deck — one primary, honest secondaries. */}
      {!terminal && (primaryAction || canManage) && (
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            {primaryAction}
            {detail.status === 'picking' && canOperate && (
              <Button
                variant="outline"
                onClick={() => refreshMutation.mutate(detail.id)}
                disabled={refreshMutation.isPending}
              >
                <RefreshCw className="me-1.5 h-4 w-4" />
                {t('batches.refreshProgress')}
              </Button>
            )}
            {canManage && (
              <>
                {skipped.length > 0 && (
                  <Button variant="outline" onClick={() => setRetryOpen(true)}>
                    <RotateCcw className="me-1.5 h-4 w-4" />
                    {t('batches.retrySkipped', { count: skipped.length })}
                  </Button>
                )}
                <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                  <Ban className="me-1.5 h-4 w-4" />
                  {t('batches.cancelBatch')}
                </Button>
              </>
            )}
          </div>
          {detail.notes && (
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              {t('batches.batchNotes')}: {detail.notes}
            </p>
          )}
        </section>
      )}

      {assignOpen && (
        <AssignBatchDialog
          batch={detail}
          canReassign={canManage}
          open
          onOpenChange={(open) => {
            if (!open) setAssignOpen(false);
          }}
        />
      )}
      {cancelOpen && (
        <CancelBatchDialog
          batch={detail}
          open
          onOpenChange={(open) => {
            if (!open) setCancelOpen(false);
          }}
        />
      )}
      {retryOpen && (
        <RetrySkippedDialog
          batch={detail}
          open
          onOpenChange={(open) => {
            if (!open) setRetryOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** The engine's next pending task, largest element on the page. */
function NextTaskCard({ next }: { next: BatchTaskRow }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary font-mono text-xl font-bold text-white">
          {next.sequence ?? '·'}
        </span>
        <div>
          <p className="text-xs font-medium uppercase text-primary">
            {t('batches.nextUp')}
          </p>
          <p className="font-mono text-xl font-bold">#{next.id}</p>
          <p className="text-xs text-muted-foreground">
            {t('batches.nextQty', {
              picked: Number(next.quantity_picked),
              total: Number(next.quantity_to_pick),
            })}
            {' · '}
            {t('batches.nextOrder', { id: next.order_id })}
          </p>
        </div>
      </div>
      <Button
        size="lg"
        onClick={() => navigate(pickingTaskRoutes.detail(next.id))}
      >
        {t('batches.startThisTask')}
        <ArrowRight className="ms-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * The 200-without-data branch — NEVER a dead end. "No pending tasks" is
 * not "finished": cross-check the task list and say what's actually left.
 */
function NextTaskEmpty({
  openCount,
  skippedCount,
  canOperate,
  onComplete,
  completing,
  onRetry,
}: {
  openCount: number;
  skippedCount: number;
  canOperate: boolean;
  onComplete: () => void;
  completing: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  if (openCount > 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-semibold">{t('batches.emptyClaimedTitle')}</span>
          <br />
          <span className="text-muted-foreground">
            {t('batches.emptyClaimedDescription', { count: openCount })}
          </span>
        </p>
      </div>
    );
  }

  if (skippedCount > 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-semibold">{t('batches.emptySkippedTitle')}</span>
          <br />
          <span className="text-muted-foreground">
            {t('batches.emptySkippedDescription', { count: skippedCount })}
          </span>
        </p>
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="me-1.5 h-4 w-4" />
          {t('batches.retrySkipped', { count: skippedCount })}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-success">
        <CheckCircle2 className="h-5 w-5" />
        {t('batches.emptyDoneTitle')}
      </p>
      {canOperate && (
        <Button onClick={onComplete} disabled={completing}>
          <CheckCircle2 className="me-1.5 h-4 w-4" />
          {completing ? t('batches.completing') : t('batches.finishBatch')}
        </Button>
      )}
    </div>
  );
}

function orderedTasks(tasks: BatchTaskRow[]): BatchTaskRow[] {
  return [...tasks].sort(
    (a, b) => (a.sequence ?? Number.MAX_SAFE_INTEGER) - (b.sequence ?? Number.MAX_SAFE_INTEGER)
  );
}

function DetailSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4" aria-busy="true" aria-label={t('common.loading')}>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-6 w-96" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export type { BatchDetail };
