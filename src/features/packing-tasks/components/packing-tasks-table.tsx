import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CalendarClock,
  MoreHorizontal,
  PackageCheck,
  UserPlus,
} from 'lucide-react';
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
import { PackingTaskStatusBadge } from './packing-task-status-badge';
import { packingTaskRoutes } from '../routes/packing-task.routes';
import {
  ASSIGNABLE_STATUSES,
  isTerminalTask,
  type PackingTaskListItem,
} from '../types/packing-task.types';

interface PackingTasksTableProps {
  data: PackingTaskListItem[];
  isLoading: boolean;
  /** Raw-grants packing permission — controls the assign row action. */
  canExecute: boolean;
  onAssign: (task: PackingTaskListItem) => void;
  assigningId?: number | null;
}

export function PackingTasksTable({
  data,
  isLoading,
  canExecute,
  onAssign,
  assigningId,
}: PackingTasksTableProps) {
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
            <TableHead>{t('packingTasks.task')}</TableHead>
            <TableHead>{t('packingTasks.fulfillment')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('packingTasks.station')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('packingTasks.assignee')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('packingTasks.weight')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('packingTasks.packedAt')}</TableHead>
            <TableHead className="hidden md:table-cell">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3" />
                {t('packingTasks.createdAt')}
              </span>
            </TableHead>
            <TableHead className="text-end">{t('packingTasks.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>
                <DataEmptyState className="border-0" />
              </TableCell>
            </TableRow>
          ) : (
            data.map((task) => {
              const terminal = isTerminalTask(task.status);
              const assignable =
                canExecute && !terminal && ASSIGNABLE_STATUSES.includes(task.status as never);
              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => navigate(packingTaskRoutes.detail(task.id))}
                      className="font-mono text-sm font-medium hover:underline"
                    >
                      #{task.id}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-sm">#{task.fulfillment_id}</TableCell>
                  <TableCell className="hidden font-mono text-sm md:table-cell">
                    {task.packing_station_id === null ? '—' : '#' + task.packing_station_id}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {task.assigned_to === null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-xs text-info">
                        #{task.assigned_to}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <PackingTaskStatusBadge status={task.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="font-mono text-sm">
                      {task.weight === null ? '—' : task.weight}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {task.packed_at ? formatDate(task.packed_at) : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3" />
                      {task.created_at ? formatDate(task.created_at) : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-end">
                    {terminal || !canExecute ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(packingTaskRoutes.detail(task.id))}
                      >
                        <PackageCheck className="me-1 h-3.5 w-3.5" />
                        {t('common.view')}
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-auto">
                          {assignable ? (
                            <DropdownMenuItem
                              disabled={assigningId === task.id}
                              onClick={() => onAssign(task)}
                            >
                              <UserPlus className="me-2 h-4 w-4" />
                              {t('packingTasks.assignAction')}
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            onClick={() => navigate(packingTaskRoutes.detail(task.id))}
                          >
                            <PackageCheck className="me-2 h-4 w-4" />
                            {t('packingTasks.openDetail')}
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
