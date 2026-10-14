import { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { DataEmptyState, DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { Skeleton } from '@/shared/ui/skeleton';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { BATCH_PERMISSIONS } from '../permissions/batch.permissions';
import { useBatches } from '../hooks/use-batches';
import { BatchCards } from '../components/batch-cards';
import { BatchHelpDialog } from '../components/batch-help-dialog';
import { CreateBatchDialog } from '../components/create-batch-dialog';
import type { BatchStatus } from '../types/batch.types';

const STATUS_FILTER_ALL = 'all';
const STATUS_FILTER_OPTIONS = [
  'pending',
  'assigned',
  'picking',
  'completed',
  'cancelled',
] as const;

type Scope = 'mine' | 'all';
type StatusChip = 'open' | 'completed' | 'cancelled' | typeof STATUS_FILTER_ALL;

const OPEN_STATUSES: string[] = ['pending', 'assigned', 'picking'];

export function BatchesPage() {
  const { t } = useTranslation();
  const rawPermissions = useAuthStore((s) => s.user?.permissions ?? []);
  // Raw-grants gates — can() bypasses checks for super_admin, but the
  // backend route pipes do NOT (reads: view-fulfillment; writes: split).
  const canManage = rawPermissions.includes(BATCH_PERMISSIONS.manage);

  const [scope, setScope] = useState<Scope>('all');
  const [statusChip, setStatusChip] = useState<StatusChip>('open');
  const [exactStatus, setExactStatus] = useState<string>(STATUS_FILTER_ALL);
  const [createOpen, setCreateOpen] = useState(false);

  const params = useMemo(() => {
    const base: { mine?: boolean; status?: BatchStatus } = {};
    if (scope === 'mine') base.mine = true;
    if (exactStatus !== STATUS_FILTER_ALL) {
      base.status = exactStatus as BatchStatus;
    }
    return base;
  }, [scope, exactStatus]);

  const { data, isLoading, isError, refetch } = useBatches(params);

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    if (exactStatus !== STATUS_FILTER_ALL) return all;
    if (statusChip === STATUS_FILTER_ALL) return all;
    if (statusChip === 'open') {
      return all.filter((batch) => OPEN_STATUSES.includes(batch.status));
    }
    return all.filter((batch) => batch.status === statusChip);
  }, [data, statusChip, exactStatus]);

  const chipCounts = useMemo(() => {
    const all = data?.data ?? [];
    return {
      open: all.filter((batch) => OPEN_STATUSES.includes(batch.status)).length,
      completed: all.filter((batch) => batch.status === 'completed').length,
      cancelled: all.filter((batch) => batch.status === 'cancelled').length,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('batches.pageTitle')}
        description={t('batches.pageDescription')}
        actions={
          <>
            <BatchHelpDialog />
            <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {canManage && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="me-1.5 h-4 w-4" />
                {t('batches.createBatch')}
              </Button>
            )}
          </>
        }
      />

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
            {t('batches.scope.' + value)}
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
            (['open', 'completed', 'cancelled'] as const).map((chip) => (
              <Button
                key={chip}
                type="button"
                variant={statusChip === chip ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setStatusChip(chip)}
              >
                {t('batches.chips.' + chip)}
                <span
                  className={cn(
                    'ms-1.5 rounded-full px-1.5 text-xs',
                    statusChip === chip
                      ? 'bg-white/25 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
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
              {t('batches.chips.all')}
            </Button>
          )}
          <FilterSelect
            value={exactStatus}
            onValueChange={setExactStatus}
            prefix={t('common.status')}
            allLabel={t('batches.allStatuses')}
            options={STATUS_FILTER_OPTIONS.map((status) => ({
              value: status,
              label: t('batches.status.' + status),
            }))}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
          />
        </div>
      </FilterBar>

      {isError ? (
        <DataErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <DataEmptyState
          title={t('batches.emptyTitle')}
          description={t('batches.emptyDescription')}
          action={
            canManage ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="me-1.5 h-4 w-4" />
                {t('batches.createBatch')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <BatchCards data={rows} />
      )}

      {createOpen && (
        <CreateBatchDialog
          open
          onOpenChange={(open) => {
            if (!open) setCreateOpen(false);
          }}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}
