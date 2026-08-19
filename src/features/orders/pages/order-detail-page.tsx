import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Trash2,
  MapPin,
  Phone,
  Mail,
  UserRound,
  ShoppingCart,
  CreditCard,
  FileText,
  Package,
  Building2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
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
import { OrderStatusBadge } from '../components/order-status-badge';
import { OrderDeleteDialog } from '../components/order-delete-dialog';
import { orderRoutes } from '../routes/order.routes';

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

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-60 rounded-xl" />
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useOrder(Number(id));
  const order = data?.data;

  const address = parseOrderAddress(order?.address);
  const street = address?.street ?? address?.street_address;

  const isPickupOrder =
    Boolean(order?.is_pickup) ||
    order?.delivery_type === 'pickup' ||
    Boolean(order?.pickup_location);

  if (isLoading) {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(orderRoutes.list)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          {t('common.delete')}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} type="order" />
          <OrderStatusBadge status={order.payment_status} type="payment" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t('orders.orderItems')}
            </h2>
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
          </section>

          {order.transactions.length > 0 && (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('orders.transactions')}
              </h2>
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
            </section>
          )}

          {order.notes && (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('orders.notes')}
              </h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              {t('orders.customerInfo')}
            </h2>
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
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('orders.shippingAddress')}
            </h2>
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
          </section>

          {isPickupOrder && (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('orders.pickupLocation')}
              </h2>
              {order.pickup_location ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">
                      {order.pickup_location.store_name ?? order.pickup_location.name ?? '—'}
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
                        {order.pickup_location.working_hours.map((h) => (
                          <p key={h.day} className="text-xs text-muted-foreground">
                            {h.day}: {h.open} – {h.close}
                          </p>
                        ))}
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('orders.pickupOrderNote')}</p>
              )}
            </section>
          )}

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold mb-4">{t('orders.priceSummary')}</h2>
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
                <div className="flex justify-between text-green-600">
                  <span>{t('orders.discount')}</span>
                  <span>-{Number(order.coupon_discount).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>{t('orders.total')}</span>
                <span>{Number(order.total_price).toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <OrderDeleteDialog
        orderId={order.id}
        orderNumber={order.order_number}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
