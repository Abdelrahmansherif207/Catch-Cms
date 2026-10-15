import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MapPin, PackageCheck, Truck, XCircle } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { DataErrorState } from '@/shared/components/data-state';
import { PageBackHeader } from '@/shared/components/page-header';
import { fulfillmentRoutes } from '@/features/fulfillments/routes/fulfillment.routes';
import {
  isDeliverable,
  isDispatchable,
  isShipmentCancellable,
} from '../types/shipment.types';
import { shipmentRoutes } from '../routes/shipment.routes';
import { ShipmentStatusBadge } from '../components/shipment-status-badge';
import {
  ShipmentCancelDialog,
  ShipmentNotesDialog,
} from '../components/shipment-command-dialogs';
import { useFulfillment } from '@/features/fulfillments/hooks/use-fulfillments';
import {
  useShipment,
  useDispatchShipment,
  useDeliverShipment,
  useCancelShipment,
} from '../hooks/use-shipments';

/**
 * Route entry: validates the numeric path param and renders the page.
 * Non-numeric segments never match the backend (whereNumber contract).
 */
export function ShipmentDetailRoute() {
  const { id } = useParams();
  if (!id || !/^\d+$/.test(id)) {
    window.location.replace(shipmentRoutes.list);
    return null;
  }
  return <ShipmentDetailPage id={Number(id)} />;
}

export function ShipmentDetailPage({ id }: { id: number }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useShipment(id);

  const dispatchMutation = useDispatchShipment();
  const deliverMutation = useDeliverShipment();
  const cancelMutation = useCancelShipment();

  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const detail = data?.data;

  // The detail's fulfillment block is not embedded — we pull it for chips.
  const { data: fulfillmentResponse } = useFulfillment(
    detail?.fulfillment_id ?? undefined
  );
  const fulfillment = fulfillmentResponse?.data;

  if (isError) {
    return <DataErrorState onRetry={() => refetch()} />;
  }

  if (isLoading || !detail) {
    return <DetailSkeleton />;
  }

  const canDispatch = isDispatchable(detail.status);
  const canDeliver = isDeliverable(detail.status);
  const canCancel = isShipmentCancellable(detail.status);

  const timeline = [
    { key: 'shipped_at', label: t('shipments.timeline.shipped') },
    { key: 'estimated_delivery_at', label: t('shipments.timeline.estimated') },
    { key: 'delivered_at', label: t('shipments.timeline.delivered') },
    { key: 'cancelled_at', label: t('shipments.timeline.cancelled') },
    { key: 'created_at', label: t('shipments.timeline.created') },
    { key: 'updated_at', label: t('shipments.timeline.updated') },
  ] as const;

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={t('shipments.detailTitle', { id: detail.id })}
        backTo={
          detail.fulfillment_id !== null
            ? fulfillmentRoutes.detail(detail.fulfillment_id)
            : shipmentRoutes.list
        }
        backLabel={t('shipments.backToLabel')}
      />

      <div className="flex flex-wrap items-center gap-2">
        <ShipmentStatusBadge status={detail.status} />
        {detail.fulfillment_id !== null && (
          <Link
            to={fulfillmentRoutes.detail(detail.fulfillment_id)}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/70"
          >
            {t('shipments.fulfillmentChip')} #{detail.fulfillment_id}
            {fulfillment && (
              <span className="text-xs text-muted-foreground">
                · {fulfillment.status}
              </span>
            )}
          </Link>
        )}
        {detail.order_id !== null && (
          <span className="rounded-full bg-muted px-3 py-1 font-mono text-sm">
            {t('shipments.orderChip')} #{detail.order_id}
          </span>
        )}
        {detail.courier && (
          <span className="rounded-full bg-info-soft px-3 py-1 text-sm text-info">
            {detail.courier}
          </span>
        )}
      </div>

      {/* Action deck — the state machine (engine texts surface verbatim). */}
      {(canDispatch || canDeliver || canCancel) && (
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            {canDispatch && (
              <Button
                onClick={() => setDispatchOpen(true)}
                disabled={dispatchMutation.isPending}
              >
                <Truck className="me-1.5 h-4 w-4" />
                {dispatchMutation.isPending
                  ? t('shipments.dispatching')
                  : t('shipments.dispatchAction')}
              </Button>
            )}
            {canDeliver && (
              <Button
                onClick={() => setDeliverOpen(true)}
                disabled={deliverMutation.isPending}
              >
                <PackageCheck className="me-1.5 h-4 w-4" />
                {detail.status === 'delivered'
                  ? t('shipments.deliverReplay')
                  : deliverMutation.isPending
                    ? t('shipments.delivering')
                    : t('shipments.deliverAction')}
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                <XCircle className="me-1.5 h-4 w-4" />
                {t('shipments.cancelAction')}
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Label fields + addresses. */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 text-sm font-semibold">{t('shipments.labelTitle')}</h2>
          <div className="space-y-2 text-sm">
            <MetaRow label={t('shipments.courier')} value={detail.courier} mono />
            <MetaRow label={t('shipments.method')} value={detail.shipping_method} mono />
            <MetaRow label={t('shipments.tracking')} value={detail.tracking_number} mono />
            <MetaRow
              label={t('shipments.weight')}
              value={detail.total_weight === null ? null : String(detail.total_weight)}
              mono
            />
            <MetaRow
              label={t('shipments.cost')}
              value={detail.shipping_cost === null ? null : String(detail.shipping_cost)}
              mono
            />
            <MetaRow label={t('shipments.currency')} value={detail.currency} mono />
          </div>
          {detail.notes && (
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              {t('shipments.messages')}: {detail.notes}
            </p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="mb-3 text-sm font-semibold">{t('shipments.auditTitle')}</h2>
          <div className="space-y-2 text-sm">
            {timeline.map((entry) => (
              <MetaRow
                key={entry.key}
                label={entry.label}
                value={formatDate(
                  (detail as unknown as Record<string, string | null>)[entry.key] ??
                    ''
                ) || null}
                mono
              />
            ))}
          </div>
          {detail.cancel_reason && (
            <div className="mt-3 space-y-1 border-t pt-3 text-xs">
              <p className="text-destructive">
                {t('shipments.cancelReason')}: {detail.cancel_reason}
              </p>
              <p className="text-muted-foreground">
                {t('shipments.cancelSource')}: {detail.cancel_source ?? '—'} ·{' '}
                {t('shipments.cancelledBy')}:{' '}
                {detail.cancelled_by === null ? '—' : '#' + detail.cancelled_by}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Addresses — open snapshot objects, rendered read-only. */}
      {(detail.origin_address || detail.destination_address) && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AddressCard title={t('shipments.origin')} value={detail.origin_address} />
          <AddressCard
            title={t('shipments.destination')}
            value={detail.destination_address}
          />
        </section>
      )}

      {dispatchOpen && (
        <ShipmentNotesDialog
          title={t('shipments.dispatchTitle')}
          description={t('shipments.dispatchDescription')}
          confirmLabel={t('shipments.dispatchSubmit')}
          loadingLabel={t('shipments.dispatching')}
          pending={dispatchMutation.isPending}
          onSubmit={(payload) =>
            dispatchMutation.mutate(
              { id: detail.id, payload },
              { onSuccess: () => setDispatchOpen(false) }
            )
          }
          onClose={() => setDispatchOpen(false)}
        />
      )}

      {deliverOpen && (
        <ShipmentNotesDialog
          title={t('shipments.deliverTitle')}
          description={t('shipments.deliverDescription')}
          confirmLabel={t('shipments.deliverSubmit')}
          loadingLabel={t('shipments.delivering')}
          pending={deliverMutation.isPending}
          onSubmit={(payload) =>
            deliverMutation.mutate(
              { id: detail.id, payload },
              { onSuccess: () => setDeliverOpen(false) }
            )
          }
          onClose={() => setDeliverOpen(false)}
        />
      )}

      {cancelOpen && (
        <ShipmentCancelDialog
          title={t('shipments.cancelTitle', { id: detail.id })}
          description={t('shipments.cancelDescription')}
          pending={cancelMutation.isPending}
          onSubmit={(reason) =>
            cancelMutation.mutate(
              { id: detail.id, payload: { reason } },
              { onSuccess: () => setCancelOpen(false) }
            )
          }
          onClose={() => setCancelOpen(false)}
        />
      )}
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={`text-end ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function AddressCard({
  title,
  value,
}: {
  title: string;
  value: Record<string, unknown> | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <MapPin className="h-4 w-4" />
        {title}
      </h2>
      {value ? (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border bg-muted/40 px-3 py-2 font-mono text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <p className="text-xs text-muted-foreground">{t('common.noData')}</p>
      )}
    </div>
  );
}

function formatDate(value: string): string {
  if (!value) return '';
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
  const { t } = useTranslation();
  return (
    <div className="space-y-4" aria-busy="true" aria-label={t('common.loading')}>
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
