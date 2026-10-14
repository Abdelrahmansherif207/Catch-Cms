import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Barcode,
  Building,
  MapPin,
  Play,
  Pencil,
  Power,
  Tags,
  Trash2,
  PackagePlus,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { DataErrorState } from '@/shared/components/data-state';
import { StatusBadge } from '@/shared/components/status-badge';
import { DetailHero } from '@/shared/components/detail-hero';
import { CardSection } from '@/shared/components/card-section';
import { Badge } from '@/shared/ui/badge';
import { Can, usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import { locationRoutes } from '../routes/location.routes';
import {
  useLocationById,
  useActivateLocation,
  useDeactivateLocation,
} from '../hooks/use-locations';
import { ReceiveStockModal } from '@/features/inventory/components/receive-stock-modal';
import { LocationFormDialog } from '../components/location-form-dialog';
import { LocationDeleteDialog } from '../components/location-delete-dialog';

export function LocationDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { can } = usePermissions();

  const locationId = id ? Number(id) : undefined;
  const { data, isLoading, isError, error, refetch } = useLocationById(locationId);

  // Parent label resolves via the SAME show endpoint (show returns the same
  // 11 keys as the index rows live-verified), enabled only when a parent exists.
  const location = data?.data;
  const parentId = location?.parent_id ?? undefined;
  const parentQuery = useLocationById(parentId);
  const parent = parentId ? parentQuery.data?.data : undefined;

  // Warehouse label reused from the warehouses feature (read-only join).
  const warehousesQuery = useWarehouses({ limit: 100 });
  const warehouses = warehousesQuery.data?.data ?? [];
  const warehouseNames: Record<string, string> = {};
  for (const wh of warehouses) {
    warehouseNames[String(wh.id)] = wh.name;
  }

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const activateMutation = useActivateLocation();
  const deactivateMutation = useDeactivateLocation();

  const canManage = can(PERMISSIONS.locations.manage);
  const canAdjustStock = can(PERMISSIONS.inventory.adjust);

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t('locations.pageTitle')}
          crumbs={[
            { label: t('sidebar.fulfillment'), to: undefined },
            { label: t('sidebar.locations'), to: locationRoutes.list },
          ]}
        />
        <DataErrorState message={(error as { message?: string })?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !location) {
    return <DetailSkeleton />;
  }

  const facts = [
    {
      icon: MapPin,
      label: t('locations.warehouse'),
      value: warehouseNames[String(location.warehouse_id)] ?? String(location.warehouse_id),
    },
    {
      icon: MapPin,
      label: t('locations.parent'),
      value: parent ? `${parent.code} — ${parent.name}` : t('locations.parentPlaceholder'),
    },
    {
      icon: Barcode,
      label: t('locations.barcode'),
      value: location.barcode || t('common.noData'),
    },
    {
      icon: Tags,
      label: t('locations.type'),
      value: location.type
        ? t(`locations.types.${location.type}`)
        : t('locations.unclassified'),
    },
    {
      icon: Tags,
      label: t('locations.priority'),
      value: location.priority ?? '—',
    },
    {
      icon: Building,
      label: t('locations.createdAt'),
      value: formatDate(location.created_at),
    },
    {
      icon: Building,
      label: t('locations.updatedAt'),
      value: formatDate(location.updated_at),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={location.name}
        crumbs={[
          { label: t('sidebar.fulfillment'), to: undefined },
          { label: t('sidebar.locations'), to: locationRoutes.list },
          { label: location.code },
        ]}
                actions={
          <>
            <Can permission={PERMISSIONS.inventory.adjust}>
              <Button onClick={() => setReceiveOpen(true)}>
                <PackagePlus className="me-1.5 h-4 w-4" />
                {t('inventory.receiveBtn')}
              </Button>
            </Can>
            <Can permission={PERMISSIONS.locations.manage}>
            <>
              {location.status !== 'active' && (
                <Button
                  variant="outline"
                  onClick={() => activateMutation.mutate(location.id)}
                  disabled={activateMutation.isPending}
                >
                  <Play className="me-1.5 h-4 w-4" />
                  {t('locations.activate')}
                </Button>
              )}

              {location.status === 'active' && (
                <Button
                  variant="outline"
                  onClick={() => deactivateMutation.mutate(location.id)}
                  disabled={deactivateMutation.isPending}
                >
                  <Power className="me-1.5 h-4 w-4" />
                  {t('locations.deactivate')}
                </Button>
              )}

              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="me-1.5 h-4 w-4" />
                {t('common.edit')}
              </Button>

              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="me-1.5 h-4 w-4" />
                {t('locations.delete')}
              </Button>
            </>
            </Can>
          </>
        }
      />

      <DetailHero
        icon={MapPin}
        iconToneClass="bg-primary/10 text-primary"
        title={location.name}
        subtitle={<span className="font-mono font-semibold">{location.code}</span>}
        badges={
          <>
            {location.status ? (
              <StatusBadge status={location.status} />
            ) : (
              <Badge variant="outline" className="font-normal text-muted-foreground">
                {t('locations.noStatus')}
              </Badge>
            )}
            {location.type && (
              <Badge variant="outline" className="gap-0.5 font-normal">
                <MapPin className="h-3 w-3" />
                {t(`locations.types.${location.type}`)}
              </Badge>
            )}
          </>
        }
        facts={facts}
      />

      {canManage && (
        <CardSection
          title={t('locations.lifecycleTitle')}
          description={t('locations.lifecycleDescription')}
        >
          <p className="text-sm text-muted-foreground">
            {location.status === 'inactive'
              ? t('locations.lifecycleInactiveNote')
              : t('locations.lifecycleActiveNote')}
          </p>
        </CardSection>
      )}

      <LocationFormDialog
        location={location}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => refetch()}
      />

      {canAdjustStock && (
        <ReceiveStockModal
          open={receiveOpen}
          onOpenChange={setReceiveOpen}
          lockedLocationId={location.id}
        />
      )}

      {canManage && (
        <LocationDeleteDialog
          locationId={location.id}
          locationName={location.name}
          locationCode={location.code}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={() => navigate(locationRoutes.list)}
        />
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
