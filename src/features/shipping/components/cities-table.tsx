import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '@/shared/lib/localize';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { DeleteDialog } from './delete-dialog';
import { useDeleteCity } from '../hooks/use-shipping';
import type { City } from '../types/shipping.types';

interface CitiesTableProps {
  data: City[];
  isLoading: boolean;
  onEdit: (city: City) => void;
  onRefresh: () => void;
}

export function CitiesTable({ data, isLoading, onEdit, onRefresh }: CitiesTableProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const deleteMutation = useDeleteCity();
  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);

  if (isLoading) return isMobile ? <MobileSkeleton /> : <TableSkeleton />;

  if (data.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="flex h-24 items-center justify-center">
          <p className="text-muted-foreground">{t('common.noData')}</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {data.map((city) => (
            <div key={city.id} className="rounded-lg border bg-card p-3 flex items-center justify-between">
              <p className="font-medium">{getLocalizedName(city.name, i18n.language || 'en')}</p>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(city)}>
                    <Pencil className="me-2 h-4 w-4" />{t('common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(city)}>
                    <Trash2 className="me-2 h-4 w-4" />{t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
        {deleteTarget && (
          <DeleteDialog
            open={!!deleteTarget}
            onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
            onConfirm={() => deleteMutation.mutate(deleteTarget.id, { onSuccess: () => { setDeleteTarget(null); onRefresh(); } })}
            titleKey="shipping.deleteCityTitle"
            descriptionKey="shipping.deleteCityConfirm"
            entityName={deleteTarget.name}
            isPending={deleteMutation.isPending}
            deletingKey="shipping.deleting"
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('shipping.name')}</TableHead>
              <TableHead>{t('shipping.governorateId')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((city) => (
              <TableRow key={city.id}>
                <TableCell className="font-medium">{getLocalizedName(city.name, i18n.language || 'en')}</TableCell>
                <TableCell className="text-muted-foreground">{city.governorate_id}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(city)}>
                        <Pencil className="me-2 h-4 w-4" />{t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(city)}>
                        <Trash2 className="me-2 h-4 w-4" />{t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {deleteTarget && (
        <DeleteDialog
          open={!!deleteTarget}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id, { onSuccess: () => { setDeleteTarget(null); onRefresh(); } })}
          titleKey="shipping.deleteCityTitle"
          descriptionKey="shipping.deleteCityConfirm"
          entityName={deleteTarget.name}
          isPending={deleteMutation.isPending}
          deletingKey="shipping.deleting"
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
            <TableHead>Name</TableHead><TableHead>Governorate</TableHead><TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-8 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-3 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}
