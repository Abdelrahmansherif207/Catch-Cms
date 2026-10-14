import { useCallback, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePickingTasks, useClaimPickingTask } from '../hooks/use-picking-tasks';
import { PickingTasksTable } from '../components/picking-tasks-table';
import { SkipTaskDialog } from '../components/skip-task-dialog';
import { pickingTaskRoutes } from '../routes/picking-task.routes';
import type { PickingTaskListItem, PickingTaskStatus } from '../types/picking-task.types';

const STATUS_FILTER_ALL = 'all';
/** Server-closed status filter set (open/done are client-side groupings). */
const STATUS_FILTER_OPTIONS = [
  'pending',
  'assigned',
  'picking',
  'picked',
  'skipped',
  'cancelled',
] as const;

type Scope = 'mine' | 'all';

/** Client-side groupings on top of the exact server statuses. */
type StatusChip = 'open' | 'picked' | 'skipped' | typeof STATUS_FILTER_ALL;

const OPEN_STATUSES: string[] = ['pending', 'assigned', 'picking'];

export function PickingTasksPage() {
  const { t } = useTranslation();
  const rawPermissions = useAuthStore((s) => s.user?.permissions ?? []);
  // Raw-grants gate — can() bypasses checks for super_admin, but the backend
  // route pipe does NOT: gate on the login payload like every WMS module.
  const canPick = rawPermissions.includes(PERMISSIONS.fulfillments.picking);

  const [scope, setScope] = useState<Scope>('mine');
  const [statusChip, setStatusChip] = useState<StatusChip>(STATUS_FILTER_ALL);
  const [exactStatus, setExactStatus] = useState<string>(STATUS_FILTER_ALL);

  const params = useMemo(() => {
    const base: { mine?: boolean; status?: PickingTaskStatus } = {};
    if (scope === 'mine') base.mine = true;
    if (exactStatus !== STATUS_FILTER_ALL) {
      base.status = exactStatus as PickingTaskStatus;
    }
    return base;
  }, [scope, exactStatus]);

  const { data, isLoading, isError, refetch } = usePickingTasks(params);
  const claimMutation = useClaimPickingTask();

  const [skipTask, setSkipTask] = useState<PickingTaskListItem | null>(null);

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    if (exactStatus !== STATUS_FILTER_ALL) return all;
    if (statusChip === STATUS_FILTER_ALL) return all;
    if (statusChip === 'open') {
      return all.filter((task) => OPEN_STATUSES.includes(task.status));
    }
    return all.filter((task) => task.status === statusChip);
  }, [data, statusChip, exactStatus]);

  const handleClaim = useCallback(
    (task: PickingTaskListItem) => {
      claimMutation.mutate(
        { id: task.id },
        {
          onSuccess: () => {
            // Claim succeeded → go straight to the pick screen.
            window.location.assign(pickingTaskRoutes.detail(task.id));
          },
        }
      );
    },
    [claimMutation]
  );

  const handleSkip = useCallback((task: PickingTaskListItem) => {
    setSkipTask(task);
  }, []);

  const chipCounts = useMemo(() => {
    const all = data?.data ?? [];
    return {
      open: all.filter((task) => OPEN_STATUSES.includes(task.status)).length,
      picked: all.filter((task) => task.status === 'picked').length,
      skipped: all.filter((task) => task.status === 'skipped').length,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('pickingTasks.pageTitle')}
        description={t('pickingTasks.pageDescription')}
        actions={
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {/* Scope tabs — "My queue" first: operators work from their claims. */}
      <div className="flex gap-2 rounded-lg border bg-muted/30 p-1 w-fit">
        {(['mine', 'all'] as Scope[]).map((value) => (
          <Button
            key={value}
            type="button"
            variant={scope === value ? 'secondary' : 'ghost'}
            size="sm"
            className="px-4"
            onClick={() => setScope(value)}
          >
            {t('pickingTasks.scope.' + value)}
          </Button>
        ))}
      </div>

      <FilterBar
        activeCount={
          (statusChip !== STATUS_FILTER_ALL ? 1 : 0) +
          (exactStatus !== STATUS_FILTER_ALL ? 1 : 0)
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {exactStatus === STATUS_FILTER_ALL &&
            (['open', 'picked', 'skipped'] as const).map((chip) => (
              <Button
                key={chip}
                type="button"
                variant={statusChip === chip ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setStatusChip(chip)}
              >
                {t('pickingTasks.chips.' + chip)}
                <span className="ms-1.5 rounded-full bg-muted px-1.5 text-xs">
                  {chipCounts[chip]}
                </span>
              </Button>
            ))}
          {statusChip !== STATUS_FILTER_ALL && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStatusChip(STATUS_FILTER_ALL)}
            >
              {t('pickingTasks.chips.all')}
            </Button>
          )}
          <FilterSelect
            value={exactStatus}
            onValueChange={setExactStatus}
            prefix={t('common.status')}
            allLabel={t('pickingTasks.allStatuses')}
            options={STATUS_FILTER_OPTIONS.map((status) => ({
              value: status,
              label: t('pickingTasks.status.' + status),
            }))}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
        </div>
      </FilterBar>

      {isError ? (
        <DataErrorState onRetry={() => refetch()} />
      ) : (
        <PickingTasksTable
          data={rows}
          isLoading={isLoading}
          canPick={canPick}
          onClaim={handleClaim}
          onSkip={handleSkip}
          claimingId={claimMutation.isPending ? claimMutation.variables?.id ?? null : null}
        />
      )}

      {skipTask && (
        <SkipTaskDialog task={skipTask} open onOpenChange={(open) => { if (!open) setSkipTask(null); }} />
      )}
    </div>
  );
}
