import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState, DataEmptyState } from '@/shared/components/data-state';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Pagination } from '@/shared/components/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { useOrderStatuses, useUpdateOrderStatusCatalog } from '../hooks/use-order-flows';
import { getLocalizedName } from '@/shared/lib/localize';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { usePermissions } from '@/shared/auth/guards';
import type { OrderStatusCatalogItem } from '../types/order-flow.types';

export function OrderStatusesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const { can } = usePermissions();
  const canUpdate = can(PERMISSIONS.orderFlows.update);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useOrderStatuses({
    page,
    per_page: 50,
    search: search || undefined,
  });

  const statuses = data?.data?.data || [];
  const links = data?.data?.links;

  const [editTarget, setEditTarget] = useState<OrderStatusCatalogItem | null>(null);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openEdit = (status: OrderStatusCatalogItem) => {
    setEditTarget(status);
    setNameEn(getLocalizedName(status.name, 'en'));
    setNameAr(getLocalizedName(status.name, 'ar'));
    setDescription(status.description ?? '');
    setIsActive(status.is_active);
  };

  const updateMutation = useUpdateOrderStatusCatalog(editTarget?.id ?? 0);

  const handleSave = () => {
    if (!editTarget) return;
    updateMutation.mutate(
      {
        name: nameAr ? { en: nameEn.trim(), ar: nameAr.trim() } : nameEn.trim(),
        description: description.trim() || null,
        is_active: isActive,
      },
      {
        onSuccess: () => setEditTarget(null),
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('orderStatuses.title')}
        description={t('orderStatuses.subtitle')}
      />

      <SearchInput
        value={search}
        placeholder={t('orderStatuses.searchPlaceholder')}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      {isError ? (
        <DataErrorState message={t('orderStatuses.listError')} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="rounded-2xl border bg-card p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : statuses.length === 0 ? (
        <DataEmptyState title={t('common.noData')} />
      ) : (
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('orderFlows.code')}</TableHead>
                <TableHead>{t('orderFlows.name')}</TableHead>
                <TableHead>{t('orderStatuses.description')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                {canUpdate && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {status.code}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">
                    {getLocalizedName(status.name, lang)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {status.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        status.is_active
                          ? 'border-transparent bg-success-soft text-success'
                          : 'border-transparent bg-muted text-muted-foreground'
                      }
                    >
                      {status.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  {canUpdate && (
                    <TableCell className="text-end">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(status)}>
                        {t('common.edit')}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={page}
        lastPage={links?.last_page ?? 1}
        total={links?.total ?? 0}
        from={links?.from ?? 0}
        to={links?.to ?? 0}
        perPage={links?.per_page ?? 50}
        onPageChange={setPage}
        className="py-2"
      />

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <code className="text-base">{editTarget?.code}</code>
            </DialogTitle>
            <DialogDescription>{t('orderStatuses.editDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('orderFlows.nameEn')}</Label>
                <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>{t('orderFlows.nameAr')}</Label>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('orderStatuses.description')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('common.active')}</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <p className="text-xs text-muted-foreground">{t('orderStatuses.codeImmutable')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending || !nameEn.trim()}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
