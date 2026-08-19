import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import type { ActivityLog } from '../types/activity-log.types';

const EVENT_COLORS: Record<string, string> = {
  created: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  updated: 'bg-blue-500/10 text-blue-600 border-blue-200',
  deleted: 'bg-red-500/10 text-red-600 border-red-200',
  restored: 'bg-purple-500/10 text-purple-600 border-purple-200',
  forceDeleted: 'bg-rose-500/10 text-rose-600 border-rose-200',
  statusChanged: 'bg-amber-500/10 text-amber-600 border-amber-200',
  roleUpdated: 'bg-violet-500/10 text-violet-600 border-violet-200',
};

function formatEvent(event: string): string {
  return event
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ActivityLogsTableProps {
  data: ActivityLog[];
  isLoading: boolean;
}

export function ActivityLogsTable({ data, isLoading }: ActivityLogsTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>{t('activityLogs.event')}</TableHead>
            <TableHead className="min-w-[200px]">{t('activityLogs.description')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('activityLogs.entity')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('activityLogs.causer')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('activityLogs.date')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                {t('common.noData')}
              </TableCell>
            </TableRow>
          ) : (
            data.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {log.id}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-block rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                      EVENT_COLORS[log.event] || 'bg-muted text-muted-foreground border-border'
                    )}
                  >
                    {formatEvent(log.event)}
                  </span>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <p className="truncate text-sm">{log.description}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {log.log_name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {log.causer_id ? `#${log.causer_id}` : '—'}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Event</TableHead>
            <TableHead className="min-w-[200px]">Description</TableHead>
            <TableHead className="hidden md:table-cell">Entity</TableHead>
            <TableHead className="hidden md:table-cell">Causer</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-6" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
