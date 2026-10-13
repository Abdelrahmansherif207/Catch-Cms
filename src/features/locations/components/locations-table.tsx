import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  MapPin,
  MoreHorizontal,
  Pencil,
  Play,
  Power,
  Trash2,
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
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { StatusBadge } from '@/shared/components/status-badge';
import { DataEmptyState } from '@/shared/components/data-state';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { locationRoutes } from '../routes/location.routes';
import {
  useActivateLocation,
  useDeactivateLocation,
} from '../hooks/use-locations';
import { LocationDeleteDialog } from './location-delete-dialog';
import type { WarehouseLocation } from '../types/location.types';

export interface LocationsTableHandlers {
  onEdit: (location: WarehouseLocation) => void;
  onDeleted: () => void;
}

/**
 * Row actions mirror the backend command set:
 * - status `null` (fresh bin) or `inactive` → Activate is offered
 * - status `active` → Deactivate is offered
 * - Delete is ALWAYS offered to managers — unlike warehouses (soft archive),
 *   locations are hard-deleted with no restore.
 */
export function LocationsTable({
  data,
  isLoading,
  warehouseNames,
  handlers,
}: {
  data: WarehouseLocation[];
  isLoading: boolean;
  warehouseNames: Record<string, string>;
  handlers: LocationsTableHandlers;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [deleteTarget, setDeleteTarget] = useState<WarehouseLocation | null>(null);

  const canManage = can(PERMISSIONS.locations.manage);
  const activateMutation = useActivateLocation();
  const deactivateMutation = useDeactivateLocation();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('locations.code')}</TableHead>
              <TableHead>{t('locations.nameCol')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('locations.warehouseCol')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('locations.typeCol')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('locations.priority')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="hidden text-sm text-muted-foreground sm:table-cell">
                {t('locations.createdAt')}
              </TableHead>
              <TableHead />
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
              data.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <Link
                      to={locationRoutes.detail(location.id)}
                      className="font-mono text-sm font-medium hover:underline"
                    >
                      {location.code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={locationRoutes.detail(location.id)}
                      className="font-medium hover:underline"
                    >
                      {location.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {warehouseNames[String(location.warehouse_id)] ?? String(location.warehouse_id)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {location.type ? (
                      <Badge variant="outline" className="gap-0.5 font-normal">
                        <MapPin className="h-3 w-3" />
                        {t(`locations.types.${location.type}`)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t('locations.unclassified')}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {location.priority ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {location.status ? (
                      <StatusBadge status={location.status} />
                    ) : (
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {t('locations.noStatus')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {formatDate(location.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(locationRoutes.detail(location.id))}>
                          <Eye className="me-2 h-4 w-4" />
                          {t('common.view')}
                        </DropdownMenuItem>

                        {canManage && (
                          <>
                            <DropdownMenuItem onClick={() => handlers.onEdit(location)}>
                              <Pencil className="me-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>

                            {location.status !== 'active' && (
                              <DropdownMenuItem
                                disabled={activateMutation.isPending}
                                onClick={() => activateMutation.mutate(location.id)}
                              >
                                <Play className="me-2 h-4 w-4" />
                                {t('locations.activate')}
                              </DropdownMenuItem>
                            )}

                            {location.status === 'active' && (
                              <DropdownMenuItem
                                disabled={deactivateMutation.isPending}
                                onClick={() => deactivateMutation.mutate(location.id)}
                              >
                                <Power className="me-2 h-4 w-4" />
                                {t('locations.deactivate')}
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(location)}
                            >
                              <Trash2 className="me-2 h-4 w-4" />
                              {t('locations.delete')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <LocationDeleteDialog
          locationId={deleteTarget.id}
          locationName={deleteTarget.name}
          locationCode={deleteTarget.code}
          open
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={handlers.onDeleted}
        />
      )}
    </>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function TableSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('locations.code')}</TableHead>
            <TableHead>{t('locations.nameCol')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('locations.warehouseCol')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('locations.typeCol')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('locations.priority')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('locations.createdAt')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
