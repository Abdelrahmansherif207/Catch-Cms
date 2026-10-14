import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CalendarClock, MoreHorizontal, PackageSearch, PlayCircle, SkipForward } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { DataEmptyState } from '@/shared/components/data-state';
import { PickingTaskStatusBadge } from './picking-task-status-badge';
import { pickingTaskRoutes } from '../routes/picking-task.routes';
import { isTerminalTask, type PickingTaskListItem } from '../types/picking-task.types';

interface PickingTasksTableProps {
  data: PickingTaskListItem[];
  isLoading: boolean;
  /** Raw-grants picking permission — controls row actions. */
  canPick: boolean;
  onClaim: (task: PickingTaskListItem) => void;
  onSkip: (task: PickingTaskListItem) => void;
  claimingId?: number | null;
}

export function PickingTasksTable({
  data,
  isLoading,
  canPick,
  onClaim,
  onSkip,
  claimingId,
}: PickingTasksTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('pickingTasks.task')}</TableHead>
            <TableHead>{t('pickingTasks.order')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('pickingTasks.item')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('pickingTasks.qty')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('pickingTasks.claimedBy')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('pickingTasks.createdAt')}</TableHead>
            <TableHead className="text-end">{t('pickingTasks.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <DataEmptyState className="border-0" />
              </TableCell>
            </TableRow>
          ) : (
            data.map((task) => {
              const terminal = isTerminalTask(task.status);
              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => navigate(pickingTaskRoutes.detail(task.id))}
                      className="font-mono text-sm font-medium hover:underline"
                    >
                      #{task.id}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-sm">#{task.order_id}</TableCell>
                  <TableCell className="hidden font-mono text-sm sm:table-cell">
                    #{task.fulfillment_item_id}
                  </TableCell>
                  <TableCell>
                    <PickingTaskStatusBadge status={task.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="font-mono text-sm">
                      {Number(task.quantity_picked)}/{Number(task.quantity_to_pick)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {task.claimed_by === null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-xs text-info">
                        #{task.claimed_by}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3" />
                      {task.created_at ? formatDate(task.created_at) : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-end">
                    {terminal || !canPick ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(pickingTaskRoutes.detail(task.id))}
                      >
                        <PackageSearch className="me-1 h-3.5 w-3.5" />
                        {t('common.view')}
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-auto">
                          {task.claimed_by === null ? (
                            <DropdownMenuItem
                              disabled={claimingId === task.id}
                              onClick={() => onClaim(task)}
                            >
                              <PlayCircle className="me-2 h-4 w-4" />
                              {t('pickingTasks.claimAction')}
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            onClick={() => navigate(pickingTaskRoutes.detail(task.id))}
                          >
                            <PackageSearch className="me-2 h-4 w-4" />
                            {t('pickingTasks.openDetail')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSkip(task)}>
                            <SkipForward className="me-2 h-4 w-4" />
                            {t('pickingTasks.skipAction')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border bg-card p-4 shadow-card">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
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
