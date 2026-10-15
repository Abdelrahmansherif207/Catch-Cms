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
import { useProfile } from '@/features/profile/hooks/use-profile';
import { usePackingStations } from '@/features/packing-stations/hooks/use-packing-stations';
import {
  usePackingTasks,
  useAssignPackingTask,
} from '../hooks/use-packing-tasks';
import { PackingTasksTable } from '../components/packing-tasks-table';
import { AssignPackingTaskDialog } from '../components/assign-packing-task-dialog';
import {
  PACKING_TASK_STATUSES,
  type PackingTaskListItem,
  type PackingTaskStatus,
} from '../types/packing-task.types';

const STATUS_FILTER_ALL = 'all';
/** Server-closed status filter set (open/packed/verified are client groupings). */
const STATUS_FILTER_OPTIONS = PACKING_TASK_STATUSES;

type Scope = 'mine' | 'all';

/** Client-side groupings on top of the exact server statuses. */
type StatusChip = 'open' | 'packed' | 'verified' | 'cancelled' | typeof STATUS_FILTER_ALL;

const OPEN_STATUSES: string[] = ['pending', 'assigned', 'packing'];

export function PackingTasksPage() {
  const { t } = useTranslation();
  // Raw-grants gate — can() bypasses checks for super_admin, but the backend
  // route pipe does NOT: gate on the login payload like every WMS module.
  const rawPermissions = useAuthStore((s) => s.user?.permissions ?? []);
  // The login payload carries NO user id — /me supplies it (10-min cache)
  // and only "My queue" needs it (assigned_to = caller id).
  const { data: profileResponse } = useProfile();
  const myUserId = profileResponse?.data?.id;
  const canExecute = rawPermissions.includes(PERMISSIONS.fulfillments.packingExecute);

  const [scope, setScope] = useState<Scope>('mine');
  const [statusChip, setStatusChip] = useState<StatusChip>(STATUS_FILTER_ALL);
  const [exactStatus, setExactStatus] = useState<string>(STATUS_FILTER_ALL);
  const [exactStation, setExactStation] = useState<string>(STATUS_FILTER_ALL);

  const { data: stationsResponse } = usePackingStations({ limit: 100 });
  const stations = stationsResponse?.data ?? [];

  const params = useMemo(() => {
    const base: {
      assignedTo?: number;
      status?: PackingTaskStatus;
      stationId?: number;
    } = {};
    // No `mine` param on the backend — "my queue" is the assignee filter.
    if (scope === 'mine' && myUserId) base.assignedTo = myUserId;
    if (exactStatus !== STATUS_FILTER_ALL) {
      base.status = exactStatus as PackingTaskStatus;
    }
    if (exactStation !== STATUS_FILTER_ALL) {
      base.stationId = Number(exactStation);
    }
    return base;
  }, [scope, exactStatus, exactStation, myUserId]);

  const { data, isLoading, isError, refetch } = usePackingTasks(params);
  const assignMutation = useAssignPackingTask();

  const [assignTask, setAssignTask] = useState<PackingTaskListItem | null>(null);

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    if (exactStatus !== STATUS_FILTER_ALL || exactStation !== STATUS_FILTER_ALL) return all;
    if (statusChip === STATUS_FILTER_ALL) return all;
    if (statusChip === 'open') {
      return all.filter((task) => OPEN_STATUSES.includes(task.status));
    }
    return all.filter((task) => task.status === statusChip);
  }, [data, statusChip, exactStatus, exactStation]);

  const handleAssign = useCallback((task: PackingTaskListItem) => {
    setAssignTask(task);
  }, []);

  const chipCounts = useMemo(() => {
    const all = data?.data ?? [];
    return {
      open: all.filter((task) => OPEN_STATUSES.includes(task.status)).length,
      packed: all.filter((task) => task.status === 'packed').length,
      verified: all.filter((task) => task.status === 'verified').length,
      cancelled: all.filter((task) => task.status === 'cancelled').length,
    };
  }, [data]);

  const activeCount =
    (statusChip !== STATUS_FILTER_ALL ? 1 : 0) +
    (exactStatus !== STATUS_FILTER_ALL ? 1 : 0) +
    (exactStation !== STATUS_FILTER_ALL ? 1 : 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('packingTasks.pageTitle')}
        description={t('packingTasks.pageDescription')}
        actions={
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {/* Scope tabs — "My queue" first: operators work from their assignments. */}
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
            {t('packingTasks.scope.' + value)}
          </Button>
        ))}
      </div>

      <FilterBar activeCount={activeCount}>
        <div className="flex flex-wrap items-center gap-2">
          {exactStatus === STATUS_FILTER_ALL && exactStation === STATUS_FILTER_ALL
            ? (['open', 'packed', 'verified', 'cancelled'] as const).map((chip) => (
                <Button
                  key={chip}
                  type="button"
                  variant={statusChip === chip ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusChip(chip)}
                >
                  {t('packingTasks.chips.' + chip)}
                  <span className="ms-1.5 rounded-full bg-muted px-1.5 text-xs">
                    {chipCounts[chip]}
                  </span>
                </Button>
              ))
            : null}
          {statusChip !== STATUS_FILTER_ALL && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStatusChip(STATUS_FILTER_ALL)}
            >
              {t('packingTasks.chips.all')}
            </Button>
          )}
          <FilterSelect
            value={exactStatus}
            onValueChange={setExactStatus}
            prefix={t('common.status')}
            allLabel={t('packingTasks.allStatuses')}
            options={STATUS_FILTER_OPTIONS.map((status) => ({
              value: status,
              label: t('packingTasks.status.' + status),
            }))}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
          <FilterSelect
            value={exactStation}
            onValueChange={setExactStation}
            prefix={t('packingTasks.station')}
            allLabel={t('packingTasks.allStations')}
            options={stations.map((station) => ({
              value: String(station.id),
              label: station.code + ' — ' + station.name,
            }))}
            triggerClassName="w-full md:w-auto md:min-w-[210px]"
          />
        </div>
      </FilterBar>

      {isError ? (
        <DataErrorState onRetry={() => refetch()} />
      ) : (
        <PackingTasksTable
          data={rows}
          isLoading={isLoading}
          canExecute={canExecute}
          onAssign={handleAssign}
          assigningId={assignMutation.isPending ? assignMutation.variables?.id ?? null : null}
        />
      )}

      {assignTask && (
        <AssignPackingTaskDialog
          task={assignTask}
          open
          onOpenChange={(open) => {
            if (!open) setAssignTask(null);
          }}
        />
      )}
    </div>
  );
}
