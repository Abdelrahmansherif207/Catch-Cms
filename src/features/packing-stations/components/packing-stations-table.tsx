import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { PackingStationStatusBadge } from './packing-station-status-badge';
import { PackingStationDeleteDialog } from './packing-station-delete-dialog';
import type { PackingStation } from '../types/packing-station.types';

interface PackingStationsTableProps {
  data: PackingStation[];
  isLoading: boolean;
  canManage: boolean;
  onEdit: (station: PackingStation) => void;
  onRefresh: () => void;
}

export function PackingStationsTable({
  data,
  isLoading,
  canManage,
  onEdit,
  onRefresh,
}: PackingStationsTableProps) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canViewUsers = can(PERMISSIONS.users.viewAdmins);
  const [deleteTarget, setDeleteTarget] = useState<PackingStation | null>(null);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('packingStations.code')}</TableHead>
            <TableHead>{t('packingStations.name')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead className="hidden sm:table-cell">
              {t('packingStations.dailyCapacity')}
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {t('packingStations.assignedTo')}
            </TableHead>
            <TableHead />
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
            data.map((station) => (
              <TableRow key={station.id}>
                <TableCell className="font-mono text-sm font-medium">
                  {station.code}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{station.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('packingStations.warehouse')}
                    {' #'}
                    {station.warehouse_id}
                  </p>
                </TableCell>
                <TableCell>
                  <PackingStationStatusBadge status={station.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">
                  {station.daily_capacity ?? '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {station.assigned_to && canViewUsers ? `#${station.assigned_to}` : '—'}
                </TableCell>
                <TableCell>
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(station)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(station)}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
             ))
           )}
        </TableBody>
      </Table>

      {deleteTarget && (
        <PackingStationDeleteDialog
          stationId={deleteTarget.id}
          stationName={deleteTarget.name}
          stationCode={deleteTarget.code}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={onRefresh}
        />
      )}
    </div>
  );
}

function TableSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('packingStations.code')}</TableHead>
            <TableHead>{t('packingStations.name')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead className="hidden sm:table-cell">
              {t('packingStations.dailyCapacity')}
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {t('packingStations.assignedTo')}
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
