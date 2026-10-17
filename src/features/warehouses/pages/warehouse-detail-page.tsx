import { useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Archive,
  Building,
  MapPin,
  Play,
  Pencil,
  Power,
  Star,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { StatusBadge } from '@/shared/components/status-badge';
import { DetailHero } from '@/shared/components/detail-hero';
import { CardSection } from '@/shared/components/card-section';
import { Badge } from '@/shared/ui/badge';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Can, usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { warehouseRoutes } from '../routes/warehouse.routes';
import {
  useWarehouse,
  useActivateWarehouse,
  useDeactivateWarehouse,
  useSetDefaultWarehouse,
} from '../hooks/use-warehouses';
import { WarehouseFormDialog } from '../components/warehouse-form-dialog';
import { WarehouseArchiveDialog } from '../components/warehouse-archive-dialog';
import { WarehouseUsersCard } from '../components/warehouse-users-card';

export function WarehouseDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { can } = usePermissions();

  const warehouseId = id ? Number(id) : undefined;
  const { data, isLoading, isError, error, refetch } = useWarehouse(warehouseId);

  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [defaultConfirmOpen, setDefaultConfirmOpen] = useState(false);

  const activateMutation = useActivateWarehouse();
  const deactivateMutation = useDeactivateWarehouse();
  const setDefaultMutation = useSetDefaultWarehouse();

  const warehouse = data?.data;
  const canManage = can(PERMISSIONS.warehouses.manage);

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t('warehouses.pageTitle')}
          crumbs={[
            { label: t('sidebar.fulfillment'), to: undefined },
            { label: t('sidebar.warehouses'), to: warehouseRoutes.list },
          ]}
        />
        <DataErrorState message={(error as { message?: string })?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !warehouse) {
    return <DetailSkeleton />;
  }

  const facts = [
    {
      icon: MapPin,
      label: t('warehouses.address'),
      value: warehouse.address || t('common.noData'),
    },
    {
      icon: Building,
      label: t('warehouses.city'),
      value: warehouse.city || t('common.noData'),
    },
    {
      icon: MapPin,
      label: t('warehouses.country'),
      value: warehouse.country || t('common.noData'),
    },
    {
      icon: Building,
      label: t('warehouses.updatedAt'),
      value: formatDate(warehouse.updated_at),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={warehouse.name}
        crumbs={[
          { label: t('sidebar.warehouses'), to: warehouseRoutes.list },
          { label: warehouse.code },
        ]}
        actions={
          <Can permission={PERMISSIONS.warehouses.manage}>
            <>
              {warehouse.status === 'inactive' ? (
                <Button
                  variant="outline"
                  onClick={() => activateMutation.mutate(warehouse.id)}
                  disabled={activateMutation.isPending}
                >
                  <Play className="me-1.5 h-4 w-4" />
                  {t('warehouses.activate')}
                </Button>
              ) : (
                !warehouse.is_default && (
                  <Button
                    variant="outline"
                    onClick={() => deactivateMutation.mutate(warehouse.id)}
                    disabled={deactivateMutation.isPending}
                  >
                    <Power className="me-1.5 h-4 w-4" />
                    {t('warehouses.deactivate')}
                  </Button>
                )
              )}

              {warehouse.status === 'active' && !warehouse.is_default && (
                <Button
                  variant="outline"
                  onClick={() => setDefaultConfirmOpen(true)}
                  disabled={setDefaultMutation.isPending}
                >
                  <Star className="me-1.5 h-4 w-4" />
                  {t('warehouses.setDefault')}
                </Button>
              )}

              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="me-1.5 h-4 w-4" />
                {t('common.edit')}
              </Button>

              {!warehouse.is_default && (
                <Button variant="destructive" onClick={() => setArchiveOpen(true)}>
                  <Archive className="me-1.5 h-4 w-4" />
                  {t('warehouses.archive')}
                </Button>
              )}
            </>
          </Can>
        }
      />

      <DetailHero
        icon={warehouse.is_default ? Star : Building}
        iconToneClass={warehouse.is_default ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}
        title={warehouse.name}
        subtitle={
          <span className="font-mono font-semibold">{warehouse.code}</span>
        }
        badges={
          <>
            <StatusBadge status={warehouse.status} />
            {warehouse.is_default && (
              <Badge variant="outline" className="gap-0.5">
                <Star className="h-3 w-3 fill-current" />
                {t('warehouses.defaultBadge')}
              </Badge>
            )}
          </>
        }
        facts={facts}
      />

      {canManage && (warehouse.status === 'inactive' || !warehouse.is_default) && (
        <CardSection
          title={t('warehouses.lifecycleTitle')}
          description={t('warehouses.lifecycleDescription')}
        >
          <p className="text-sm text-muted-foreground">
            {warehouse.status === 'inactive'
              ? t('warehouses.lifecycleInactiveNote')
              : t('warehouses.lifecycleActiveNote')}
          </p>
        </CardSection>
      )}

      <WarehouseUsersCard warehouse={warehouse} onChanged={() => refetch()} />

      <WarehouseFormDialog warehouse={warehouse} open={editOpen} onOpenChange={setEditOpen} onSuccess={() => refetch()} />

      {canManage && (
        <>
          <WarehouseArchiveDialog
            warehouseId={warehouse.id}
            warehouseName={warehouse.name}
            warehouseCode={warehouse.code}
            open={archiveOpen}
            onOpenChange={setArchiveOpen}
          />

          <ConfirmDialog
            open={defaultConfirmOpen}
            onOpenChange={setDefaultConfirmOpen}
            title={t('warehouses.setDefaultTitle')}
            description={t('warehouses.setDefaultConfirm', {
              name: warehouse.name,
              code: warehouse.code,
            })}
            confirmLabel={t('warehouses.setDefault')}
            tone="default"
            loading={setDefaultMutation.isPending}
            onConfirm={() => {
              setDefaultMutation.mutate(warehouse.id, {
                onSuccess: () => setDefaultConfirmOpen(false),
              });
            }}
          />
        </>
      )}
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

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-48 animate-pulse rounded-2xl bg-card shadow-card" />
    </div>
  );
}
