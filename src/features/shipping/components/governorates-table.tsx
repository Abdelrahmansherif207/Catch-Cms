import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '@/shared/lib/localize';
import { useNavigate } from 'react-router';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { DeleteDialog } from './delete-dialog';
import { useDeleteGovernorate } from '../hooks/use-shipping';
import type { Governorate } from '../types/shipping.types';

interface GovernoratesTableProps {
  data: Governorate[];
  isLoading: boolean;
  isNested?: boolean;
  onEdit: (gov: Governorate) => void;
  onRefresh: () => void;
}

export function GovernoratesTable({ data, isLoading, isNested, onEdit, onRefresh }: GovernoratesTableProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const deleteMutation = useDeleteGovernorate();
  const [deleteTarget, setDeleteTarget] = useState<Governorate | null>(null);

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

  const citiesLink = (gov: Governorate) =>
    isNested
      ? navigate(`/shipping/governorates/${gov.id}/cities`)
      : navigate(`/shipping/governorates/${gov.id}/cities`);

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {data.map((gov) => (
            <div key={gov.id} className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{getLocalizedName(gov.name, i18n.language || 'en')}</p>
                  {gov.shipping_price && (
                    <p className="text-xs text-muted-foreground">
                      {t('shipping.price')}: {gov.shipping_price.price} | {t('shipping.estimatedDays')}: {gov.shipping_price.estimated_days}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={gov.status ? 'default' : 'secondary'}>{gov.status ? t('shipping.active') : t('shipping.inactive')}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => citiesLink(gov)}>
                  <MapPin className="h-3.5 w-3.5 me-1" />{t('shipping.viewCities')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(gov)}>
                      <Pencil className="me-2 h-4 w-4" />{t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(gov)}>
                      <Trash2 className="me-2 h-4 w-4" />{t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
        {deleteTarget && (
          <DeleteDialog
            open={!!deleteTarget}
            onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
            onConfirm={() => deleteMutation.mutate(deleteTarget.id, { onSuccess: () => { setDeleteTarget(null); onRefresh(); } })}
            titleKey="shipping.deleteGovernorateTitle"
            descriptionKey="shipping.deleteGovernorateConfirm"
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
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('shipping.shippingPrice')}</TableHead>
              <TableHead>{t('shipping.cities')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((gov) => (
              <TableRow key={gov.id}>
                <TableCell className="font-medium">{getLocalizedName(gov.name, i18n.language || 'en')}</TableCell>
                <TableCell>
                  <Badge variant={gov.status ? 'default' : 'secondary'}>
                    {gov.status ? t('shipping.active') : t('shipping.inactive')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {gov.shipping_price ? (
                    <span className="text-sm">{gov.shipping_price.price} {t('shipping.currency')} / {gov.shipping_price.estimated_days}d</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('common.notSet')}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="link" size="sm" onClick={() => citiesLink(gov)}>
                    <MapPin className="h-3.5 w-3.5 me-1" />{t('shipping.viewCities')}
                  </Button>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(gov)}>
                        <Pencil className="me-2 h-4 w-4" />{t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(gov)}>
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
          titleKey="shipping.deleteGovernorateTitle"
          descriptionKey="shipping.deleteGovernorateConfirm"
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
            <TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Shipping Price</TableHead><TableHead>Cities</TableHead><TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
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
        <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}
