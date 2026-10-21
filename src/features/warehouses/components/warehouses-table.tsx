import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Archive,
  Eye,
  Map,
  MoreHorizontal,
  Pencil,
  Play,
  Power,
  Star,
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
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { warehouseRoutes } from '../routes/warehouse.routes';
import { warehouseMapRoutes } from '@/features/warehouse-map/routes/warehouse-map.routes';
import {
  useActivateWarehouse,
  useDeactivateWarehouse,
  useSetDefaultWarehouse,
} from '../hooks/use-warehouses';
import { WarehouseArchiveDialog } from './warehouse-archive-dialog';
import type { Warehouse } from '../types/warehouse.types';

export interface WarehousesTableHandlers {
  onEdit: (warehouse: Warehouse) => void;
  onArchived: () => void;
}

/**
 * Row actions are gated EXACTLY like the backend guards so users never see a
 * button that would 422:
 * - default row  → no Archive, no Deactivate (backend blocks both)
 * - inactive row → no Set-default (backend blocks it until activation)
 */
export function WarehousesTable({
  data,
  isLoading,
  handlers,
}: {
  data: Warehouse[];
  isLoading: boolean;
  handlers: WarehousesTableHandlers;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [archiveTarget, setArchiveTarget] = useState<Warehouse | null>(null);
  const [defaultTarget, setDefaultTarget] = useState<Warehouse | null>(null);

  const canManage = can(PERMISSIONS.warehouses.manage);
  const canViewMap = can(PERMISSIONS.locations.view);
  const setDefaultMutation = useSetDefaultWarehouse();
  const activateMutation = useActivateWarehouse();
  const deactivateMutation = useDeactivateWarehouse();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('warehouses.code')}</TableHead>
              <TableHead>{t('warehouses.nameCol')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('warehouses.location')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('warehouses.createdAt')}</TableHead>
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
              data.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell>
                    <Link
                      to={warehouseRoutes.detail(warehouse.id)}
                      className="font-mono text-sm font-medium hover:underline"
                    >
                      {warehouse.code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={warehouseRoutes.detail(warehouse.id)}
                        className="font-medium hover:underline"
                      >
                        {warehouse.name}
                      </Link>
                      {warehouse.is_default && (
                        <Badge variant="outline" className="gap-0.5">
                          <Star className="h-3 w-3 fill-current" />
                          {t('warehouses.defaultBadge')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="block max-w-[250px] truncate text-sm text-muted-foreground">
                      {[warehouse.city, warehouse.country].filter(Boolean).join(', ') || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={warehouse.status} />
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {formatDate(warehouse.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(warehouseRoutes.detail(warehouse.id))}>
                          <Eye className="me-2 h-4 w-4" />
                          {t('common.view')}
                        </DropdownMenuItem>

                        {canViewMap && (
                          <DropdownMenuItem
                            onClick={() => navigate(warehouseMapRoutes.detail(warehouse.id))}
                          >
                            <Map className="me-2 h-4 w-4" />
                            {t('warehouseMap.viewMap')}
                          </DropdownMenuItem>
                        )}
                        {canManage && (
                          <>
                            <DropdownMenuItem onClick={() => handlers.onEdit(warehouse)}>
                              <Pencil className="me-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>

                            {warehouse.status === 'inactive' && (
                              <DropdownMenuItem
                                disabled={activateMutation.isPending}
                                onClick={() => activateMutation.mutate(warehouse.id)}
                              >
                                <Play className="me-2 h-4 w-4" />
                                {t('warehouses.activate')}
                              </DropdownMenuItem>
                            )}

                            {warehouse.status === 'active' && !warehouse.is_default && (
                              <DropdownMenuItem
                                disabled={deactivateMutation.isPending}
                                onClick={() => deactivateMutation.mutate(warehouse.id)}
                              >
                                <Power className="me-2 h-4 w-4" />
                                {t('warehouses.deactivate')}
                              </DropdownMenuItem>
                            )}

                            {warehouse.status === 'active' && !warehouse.is_default && (
                              <DropdownMenuItem onClick={() => setDefaultTarget(warehouse)}>
                                <Star className="me-2 h-4 w-4" />
                                {t('warehouses.setDefault')}
                              </DropdownMenuItem>
                            )}

                            {!warehouse.is_default && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setArchiveTarget(warehouse)}
                              >
                                <Archive className="me-2 h-4 w-4" />
                                {t('warehouses.archive')}
                              </DropdownMenuItem>
                            )}
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

      {archiveTarget && (
        <WarehouseArchiveDialog
          warehouseId={archiveTarget.id}
          warehouseName={archiveTarget.name}
          warehouseCode={archiveTarget.code}
          open
          onOpenChange={(open) => {
            if (!open) setArchiveTarget(null);
          }}
          onArchived={handlers.onArchived}
        />
      )}

      {defaultTarget && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setDefaultTarget(null);
          }}
          title={t('warehouses.setDefaultTitle')}
          description={t('warehouses.setDefaultConfirm', {
            name: defaultTarget.name,
            code: defaultTarget.code,
          })}
          confirmLabel={t('warehouses.setDefault')}
          tone="default"
          loading={setDefaultMutation.isPending}
          onConfirm={() => {
            setDefaultMutation.mutate(defaultTarget.id, {
              onSuccess: () => setDefaultTarget(null),
            });
          }}
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
            <TableHead>{t('warehouses.code')}</TableHead>
            <TableHead>{t('warehouses.nameCol')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('warehouses.location')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('warehouses.createdAt')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
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
