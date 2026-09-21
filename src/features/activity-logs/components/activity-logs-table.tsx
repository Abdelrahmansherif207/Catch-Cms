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
import { Badge } from '@/shared/ui/badge';
import { DataEmptyState } from '@/shared/components/data-state';
import type { ActivityLog } from '../types/activity-log.types';

const EVENT_COLORS: Record<string, string> = {
  created: 'border-transparent bg-success-soft text-success',
  updated: 'border-transparent bg-info-soft text-info',
  deleted: 'border-transparent bg-destructive-soft text-destructive',
  restored: 'border-transparent bg-info-soft text-info',
  forceDeleted: 'border-transparent bg-destructive-soft text-destructive',
  statusChanged: 'border-transparent bg-warning-soft text-warning',
  roleUpdated: 'border-transparent bg-info-soft text-info',
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
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
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
              <TableCell colSpan={6}>
                <DataEmptyState className="border-0" />
              </TableCell>
            </TableRow>
          ) : (
            data.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {log.id}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={EVENT_COLORS[log.event] || 'border-transparent bg-muted text-muted-foreground'}
                  >
                    {formatEvent(log.event)}
                  </Badge>
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
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
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
