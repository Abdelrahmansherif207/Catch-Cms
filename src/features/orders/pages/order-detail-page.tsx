import { useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CircleDot,
  Clock,
  MapPin,
  Phone,
  Mail,
  UserRound,
  ShoppingCart,
  CreditCard,
  FileText,
  Package,
  Building2,
  Receipt,
  Repeat,
  Truck,
  XCircle,
  KeyRound,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { PageBackHeader } from '@/shared/components/page-header';
import { DetailHero } from '@/shared/components/detail-hero';
import { CardSection } from '@/shared/components/card-section';
import { DataErrorState } from '@/shared/components/data-state';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useOrder } from '../hooks/use-orders';
import {
  useOrderShipment,
  useTrackingOrder,
  useCancelTrackingOrder,
  useUpdateShipmentStatus,
} from '@/features/tracking/hooks/use-tracking';
import { getLocalizedName } from '@/shared/lib/localize';
import { OrderStatusBadge } from '../components/order-status-badge';
import { OrderStatusSelect } from '../components/order-status-select';
import { OrderDeleteDialog } from '../components/order-delete-dialog';
import { FulfillmentStatusBadge } from '../components/fulfillment-status-badge';
import { ShipmentStatusBadge } from '../components/shipment-status-badge';
import { CancelOrderDialog } from '../components/cancel-order-dialog';
import { UpdateShipmentDialog } from '../components/update-shipment-dialog';
import { orderRoutes } from '../routes/order.routes';
import type { UpdateShipmentStatusData } from '@/features/tracking/types/tracking.types';

interface ParsedAddress {
  street?: string;
  street_address?: string;
  city?: string;
  state?: string;
  country?: string;
}

function parseOrderAddress(raw: unknown): ParsedAddress | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ParsedAddress;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') {
    return raw as ParsedAddress;
  }
  return null;
}

/** Route entry: validates the numeric path param against both detail GETs. */
export function OrderDetailPage() {
  const { id } = useParams();
  if (!id || !/^\d+$/.test(id)) {
    window.location.replace(orderRoutes.list);
    return null;
  }
  return <OrderDetailView id={Number(id)} />;
}

function OrderDetailView({ id }: { id: number }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || 'en';
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Core order payload (items, transactions, address, prices)…
  const { data: orderResponse, isLoading: orderLoading } = useOrder(id);
  // …plus the tracking payload (timeline, analytics, engine actions) and
  // the order-level shipment read, from the former /tracking/orders pages.
  const {
    data: trackingResponse,
    isLoading: trackingLoading,
    isError: trackingIsError,
    refetch: refetchTracking,
  } = useTrackingOrder(id);
  const { data: shipmentResponse } = useOrderShipment(id);

  const updateMutation = useUpdateShipmentStatus();
  const cancelMutation = useCancelTrackingOrder();

  const order = orderResponse?.data;
  const detail = trackingResponse?.data;
  const trackingOrder = detail?.order;
  const shipment = shipmentResponse?.data;

  const address = parseOrderAddress(order?.address);
  const street = address?.street ?? address?.street_address;

  const isPickupOrder =
    Boolean(order?.is_pickup) ||
    order?.delivery_type === 'pickup' ||
    Boolean(order?.pickup_location);

  if (orderLoading || trackingLoading) {
    return <DetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">{t('common.noData')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(orderRoutes.list)}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const actions = detail?.actions_available;
  const canCancel = actions?.can_cancel ?? false;

  const submitCancel = (reason: string) => {
    cancelMutation.mutate(
      { orderId: id, payload: { reason } },
      { onSuccess: () => setCancelOpen(false) }
    );
  };

  const submitUpdate = (payload: UpdateShipmentStatusData) => {
    updateMutation.mutate(
      { orderId: id, payload },
      { onSuccess: () => setUpdateOpen(false) }
    );
  };

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={order.order_number}
        description={new Date(order.created_at).toLocaleString()}
        backTo={orderRoutes.list}
        backLabel={t('common.back')}
        actions={
          <>
            <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/digital-entitlements?order_id=${order.id}`)}
            >
              <KeyRound className="me-2 h-4 w-4" />
              {t('orders.viewEntitlements')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpdateOpen(true)}
              disabled={updateMutation.isPending}
            >
              <Truck className="me-2 h-4 w-4" />
              {updateMutation.isPending
                ? t('orders.shipmentDialog.updating')
                : t('orders.updateShipment')}
            </Button>
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setCancelOpen(true)}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="me-2 h-4 w-4" />
                {cancelMutation.isPending
                  ? t('orders.cancelDialog.cancelling')
                  : t('orders.cancelOrder')}
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="me-2 h-4 w-4" />
              {t('common.delete')}
            </Button>
          </>
        }
      />

      <DetailHero
        title={order.order_number}
        subtitle={new Date(order.created_at).toLocaleString()}
        badges={
          <>
            <OrderStatusBadge status={order.status} type="order" />
            <OrderStatusBadge status={order.payment_status} type="payment" />
            {trackingOrder?.fulfillment_status && (
              <FulfillmentStatusBadge status={trackingOrder.fulfillment_status} />
            )}
            <ShipmentStatusBadge
              status={
                shipment?.shipment_status ?? trackingOrder?.shipment_status ?? null
              }
            />
            {trackingOrder?.order_status && (
              <Badge variant="outline" className="font-mono font-normal">
                {trackingOrder.order_status}
              </Badge>
            )}
          </>
        }
        icon={ShoppingCart}
        iconToneClass="bg-info-soft text-info"
        facts={[
          { icon: UserRound, label: t('orders.customerInfo'), value: order.customer_name },
          { icon: Receipt, label: t('orders.total'), value: Number(order.total_price).toFixed(2) },
          { icon: Package, label: t('orders.orderItems'), value: order.order_items.length },
          {
            icon: CreditCard,
            label: t('orders.paymentMethod'),
            value:
              order.transactions[0]?.payment_method ?? trackingOrder?.payment_method ?? '—',
          },
        ]}
      />

      {trackingIsError && (
        <DataErrorState message={t('orders.trackingError')} onRetry={() => refetchTracking()} />
      )}

      {detail && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Repeat}
              label={t('orders.statusChanges')}
              value={String(detail.analytics.total_status_changes)}
            />
            <MetricCard
              icon={Clock}
              label={t('orders.timeToComplete')}
              value={detail.analytics.time_to_complete ?? t('orders.notCompleted')}
            />
            <MetricCard
              icon={Clock}
              label={t('orders.sinceCreation')}
              value={detail.analytics.time_since_creation}
            />
            <MetricCard
              icon={Clock}
              label={t('orders.inCurrentStatus')}
              value={detail.analytics.time_in_current_status}
            />
          </div>

          {actions && (
            <section className="rounded-2xl border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-1.5">
                <HintChip active={actions.can_process} text={t('orders.actions.canProcess')} />
                <HintChip active={actions.can_refund} text={t('orders.actions.canRefund')} />
                <HintChip
                  active={actions.can_mark_delivered}
                  text={t('orders.actions.canMarkDelivered')}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t('orders.engineGatedHint')}</p>
            </section>
          )}
        </>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {detail && (
            <CardSection title={t('orders.timeline')} icon={CircleDot}>
              <Timeline entries={detail.timeline} />
            </CardSection>
          )}

          <CardSection title={t('orders.orderItems')} icon={Package}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orders.product')}</TableHead>
                  <TableHead>{t('orders.sku')}</TableHead>
                  <TableHead className="text-end">{t('orders.quantity')}</TableHead>
                  <TableHead className="text-end">{t('orders.unitPrice')}</TableHead>
                  <TableHead className="text-end">{t('orders.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.order_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.product_sku}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {item.product_sku}
                      </code>
                    </TableCell>
                    <TableCell className="text-end">{item.quantity}</TableCell>
                    <TableCell className="text-end">
                      {Number(item.unit_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-end font-medium">
                      {Number(item.total_price).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardSection>

          {order.transactions.length > 0 && (
            <CardSection title={t('orders.transactions')} icon={CreditCard}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('orders.invoice')}</TableHead>
                    <TableHead>{t('orders.paymentMethod')}</TableHead>
                    <TableHead>{t('orders.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          #{tx.invoice_id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.payment_method}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardSection>
          )}

          {order.notes && (
            <CardSection title={t('orders.notes')} icon={FileText}>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </CardSection>
          )}
        </div>

        <div className="space-y-6">
          <CardSection title={t('orders.shipmentPanel')} icon={Truck}>
            <dl className="space-y-2 text-sm">
              <DetailRow label={t('orders.shipment.statusLabel')}>
                <ShipmentStatusBadge status={shipment?.shipment_status ?? null} />
              </DetailRow>
              <DetailRow label={t('orders.shipment.trackingNumber')}>
                <span className="font-mono text-xs">
                  {shipment?.tracking_number ?? trackingOrder?.tracking_number ?? '—'}
                </span>
              </DetailRow>
              <DetailRow label={t('orders.shipment.courier')}>
                <span>{shipment?.courier_name ?? trackingOrder?.courier_name ?? '—'}</span>
              </DetailRow>
              <DetailRow label={t('orders.shipment.estimated')}>
                <span className="text-xs">
                  {shipment?.estimated_delivery_at
                    ? new Date(shipment.estimated_delivery_at).toLocaleString()
                    : '—'}
                </span>
              </DetailRow>
              <DetailRow label={t('orders.shipment.actual')}>
                <span className="text-xs">
                  {shipment?.actual_delivery_at
                    ? new Date(shipment.actual_delivery_at).toLocaleString()
                    : '—'}
                </span>
              </DetailRow>
            </dl>
          </CardSection>

          <CardSection title={t('orders.customerInfo')} icon={UserRound}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{order.customer_email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span dir="ltr">{order.customer_phone}</span>
              </div>
            </div>
          </CardSection>

          <CardSection title={t('orders.shippingAddress')} icon={MapPin}>
            <div className="space-y-1 text-sm">
              <p>{street}</p>
              <p>
                {address?.city}{address?.state ? `, ${address.state}` : ''}
              </p>
              <p>{address?.country}</p>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t('orders.shippingMethod')}:</span>
              <span className="font-medium">{order.shipping_method}</span>
            </div>
          </CardSection>

          {isPickupOrder && (
            <CardSection title={t('orders.pickupLocation')} icon={Building2}>
              {order.pickup_location ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">
                      {getLocalizedName(
                        order.pickup_location.store_name ??
                          order.pickup_location.name,
                        lang
                      ) || '—'}
                    </span>
                  </div>
                  {order.pickup_location.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        {order.pickup_location.address}
                        {order.pickup_location.city ? `, ${order.pickup_location.city}` : ''}
                      </span>
                    </div>
                  )}
                  {order.pickup_location.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span dir="ltr">{order.pickup_location.phone}</span>
                    </div>
                  )}
                  {order.pickup_location.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{order.pickup_location.email}</span>
                    </div>
                  )}
                  {order.pickup_location.working_hours &&
                    order.pickup_location.working_hours.length > 0 && (
                      <div className="space-y-1 border-t pt-2">
                        {order.pickup_location.working_hours.map((h, index) => (
                          <p
                            key={
                              getLocalizedName(h.day, 'en') || `day-${index}`
                            }
                            className="text-xs text-muted-foreground"
                          >
                            {getLocalizedName(h.day, lang)}: {h.open} –{' '}
                            {h.close}
                          </p>
                        ))}
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('orders.pickupOrderNote')}</p>
              )}
            </CardSection>
          )}

          <CardSection title={t('orders.priceSummary')} icon={Receipt}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('orders.subtotal')}</span>
                <span>{Number(order.price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('orders.shipping')}</span>
                <span>
                  {order.shipping_price
                    ? Number(order.shipping_price).toFixed(2)
                    : '—'}
                </span>
              </div>
              {order.coupon_discount && (
                <div className="flex justify-between text-success">
                  <span>{t('orders.discount')}</span>
                  <span>-{Number(order.coupon_discount).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>{t('orders.total')}</span>
                <span>
                  {Number(order.total_price).toLocaleString()}{' '}
                  <span className="text-xs text-muted-foreground">
                    {trackingOrder?.currency_code ?? ''}
                  </span>
                </span>
              </div>
            </div>
          </CardSection>

          {trackingOrder?.cancelled_at && (
            <CardSection title={t('orders.status')} icon={XCircle}>
              <p className="text-sm text-destructive">
                {t('orders.cancelledAt')}:{' '}
                {new Date(trackingOrder.cancelled_at).toLocaleString()}
              </p>
            </CardSection>
          )}
        </div>
      </div>

      <OrderDeleteDialog
        orderId={order.id}
        orderNumber={order.order_number}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      {updateOpen && (
        <UpdateShipmentDialog
          orderId={id}
          currentStatus={shipment?.shipment_status ?? trackingOrder?.shipment_status ?? null}
          currentTrackingNumber={
            shipment?.tracking_number ?? trackingOrder?.tracking_number ?? null
          }
          currentCourier={shipment?.courier_name ?? trackingOrder?.courier_name ?? null}
          currentEstimatedDeliveryAt={shipment?.estimated_delivery_at ?? null}
          pending={updateMutation.isPending}
          onSubmit={submitUpdate}
          onClose={() => setUpdateOpen(false)}
        />
      )}

      {cancelOpen && (
        <CancelOrderDialog
          orderNumber={order.order_number}
          pending={cancelMutation.isPending}
          onSubmit={submitCancel}
          onClose={() => setCancelOpen(false)}
        />
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-60 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-2xs font-semibold text-muted-foreground uppercase">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <dt className="shrink-0 text-xs font-semibold text-muted-foreground uppercase">{label}</dt>
      <dd className="min-w-0 text-end">{children}</dd>
    </div>
  );
}

function HintChip({ active, text }: { active: boolean; text: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs ${
        active
          ? 'bg-info-soft text-info'
          : 'bg-muted text-muted-foreground line-through opacity-60'
      }`}
      title={active ? undefined : text}
    >
      {text}
    </span>
  );
}

interface TimelineProps {
  entries: {
    id: number;
    timestamp_human: string;
    timestamp: string;
    old_status: string | null;
    new_status: string | null;
    payment_status: string | null;
    fulfillment_status: string | null;
    changed_by: { name: string; email: string } | null;
    changed_by_type: string | null;
    notes: string | null;
  }[];
}

function Timeline({ entries }: TimelineProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">{t('orders.noTimeline')}</p>
    );
  }

  return (
    <ol className="mt-4 space-y-0">
      {entries.map((entry, index) => (
        <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < entries.length - 1 && (
            <span className="absolute start-[7px] top-4 h-full w-px bg-border" aria-hidden />
          )}
          <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {entry.new_status && <OrderStatusBadge status={entry.new_status} />}
              <span className="text-xs text-muted-foreground">
                {entry.old_status
                  ? t('orders.transition', {
                      from: t(`orders.statuses.${entry.old_status}`, { defaultValue: entry.old_status }),
                      at: entry.timestamp_human,
                    })
                  : t('orders.timelineAt', { at: entry.timestamp_human })}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {entry.changed_by && (
                <span>
                  {entry.changed_by.name}
                  {entry.changed_by_type ? ` · ${entry.changed_by_type}` : ''}
                </span>
              )}
              {entry.payment_status && <span>{entry.payment_status}</span>}
              {entry.fulfillment_status && <span>{entry.fulfillment_status}</span>}
            </div>
            {entry.notes && <p className="mt-1 text-xs">{entry.notes}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
