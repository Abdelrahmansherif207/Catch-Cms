import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import { PickupLocationStatusBadge } from './pickup-location-status-badge';
import { PickupLocationDeleteDialog } from './pickup-location-delete-dialog';
import type { PickupLocation } from '../types/pickup-location.types';

interface PickupLocationsTableProps {
  data: PickupLocation[];
  isLoading: boolean;
  onEdit: (location: PickupLocation) => void;
  onRefresh: () => void;
}

export function PickupLocationsTable({ data, isLoading, onEdit, onRefresh }: PickupLocationsTableProps) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<PickupLocation | null>(null);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t('pickupLocations.displayOrder')}</TableHead>
              <TableHead>{t('pickupLocations.storeName')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('pickupLocations.address')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('pickupLocations.phone')}</TableHead>
              <TableHead>{t('pickupLocations.status')}</TableHead>
              <TableHead />
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
              data.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {location.display_order}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{location.store_name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {location.email}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground truncate max-w-[250px] block">
                      {location.address}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {location.phone}
                  </TableCell>
                  <TableCell>
                    <PickupLocationStatusBadge status={location.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(location)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(location)}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
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
        <PickupLocationDeleteDialog
          locationId={deleteTarget.id}
          locationName={deleteTarget.store_name}
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{'Name'}</TableHead>
            <TableHead className="hidden md:table-cell">{'Address'}</TableHead>
            <TableHead className="hidden sm:table-cell">{'Phone'}</TableHead>
            <TableHead>{'Status'}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /><Skeleton className="mt-1 h-3 w-24" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
