import type {
  InvoiceDetail,
  InvoiceListItem,
  InvoiceSnapshotAddress,
  InvoiceSnapshotItem,
  InvoiceStatus,
} from '../types/invoice.types';

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'pending',
  'generating',
  'generated',
  'pdf_generating',
  'ready',
  'failed',
  'verified',
  'downloaded',
  'printed',
  'corrected',
  'cancelled',
  'archived',
];

export const INVOICE_PAYMENT_METHODS = [
  'pay_at_cashier',
  'cash',
  'card',
  'wallet',
  'bank_transfer',
  'cod',
];

export const invoiceStatusStyles: Record<InvoiceStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700',
  generating: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  generated: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  pdf_generating: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  ready: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  failed: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  verified: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
  downloaded: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  printed: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  corrected: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  cancelled: 'bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600',
  archived: 'bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600',
};

export function isPdfPending(status: InvoiceStatus): boolean {
  return status === 'generating' || status === 'generated' || status === 'pdf_generating';
}

export function isPdfTerminal(status: InvoiceStatus): boolean {
  return status === 'ready' || status === 'failed';
}

export function isCancelable(status: InvoiceStatus): boolean {
  return !['cancelled', 'corrected', 'archived', 'verified'].includes(status);
}

export function canBeCorrected(status: InvoiceStatus): boolean {
  return !['cancelled', 'archived'].includes(status);
}

export function formatMoney(value: number | string | null | undefined, currency?: string | null): string {
  const num = Number(value ?? 0);
  const formatted = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function humanizeStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type InvoiceLike = InvoiceListItem & Partial<InvoiceDetail>;

export function getInvoiceCustomerName(invoice: InvoiceLike): string | null {
  return (
    invoice.customer_name ??
    invoice.snapshot?.customer?.name ??
    (invoice as InvoiceDetail).customer?.name ??
    null
  );
}

export function getInvoiceOrderNumber(invoice: InvoiceLike): string | null {
  return invoice.order_number ?? invoice.snapshot?.order?.order_number ?? null;
}

export function getSnapshotItems(invoice: InvoiceLike): InvoiceSnapshotItem[] {
  const snapshotItems = invoice.snapshot?.items;
  if (snapshotItems && snapshotItems.length > 0) return snapshotItems;

  const legacy = (invoice as InvoiceDetail).items;
  if (!legacy) return [];
  return legacy.map((item) => ({
    product_name: item.product_name ?? item.name ?? '—',
    product_sku: item.product_sku ?? item.sku ?? '—',
    attributes: null,
    quantity: item.quantity,
    unit_price: Number(item.unit_price ?? item.price ?? 0),
    total_price: Number(item.total ?? item.total_price ?? item.line_total ?? 0),
    is_gift: false,
  }));
}

export interface InvoicePricingRow {
  label: 'subtotal' | 'promotionDiscount' | 'couponDiscount' | 'shipping' | 'fastShippingFee' | 'total';
  value: number;
}

export function getPricingRows(invoice: InvoiceLike): InvoicePricingRow[] {
  const breakdown = invoice.snapshot?.pricing_breakdown;
  if (breakdown) {
    const rows: InvoicePricingRow[] = [{ label: 'subtotal', value: Number(breakdown.subtotal ?? 0) }];
    if (Number(breakdown.promotion_discount)) {
      rows.push({ label: 'promotionDiscount', value: Number(breakdown.promotion_discount) });
    }
    if (Number(breakdown.coupon_discount)) {
      rows.push({ label: 'couponDiscount', value: Number(breakdown.coupon_discount) });
    }
    rows.push({ label: 'shipping', value: Number(breakdown.shipping_price ?? 0) });
    if (Number(breakdown.fast_shipping_fee)) {
      rows.push({ label: 'fastShippingFee', value: Number(breakdown.fast_shipping_fee) });
    }
    rows.push({ label: 'total', value: Number(breakdown.total ?? invoice.total) });
    return rows;
  }

  const detail = invoice as InvoiceDetail;
  const rows: InvoicePricingRow[] = [
    { label: 'subtotal', value: Number(invoice.subtotal ?? 0) },
  ];
  if (Number(detail.promotion_discount)) {
    rows.push({ label: 'promotionDiscount', value: Number(detail.promotion_discount) });
  }
  if (Number(detail.coupon_discount)) {
    rows.push({ label: 'couponDiscount', value: Number(detail.coupon_discount) });
  }
  rows.push({ label: 'shipping', value: Number(invoice.shipping_price ?? 0) });
  rows.push({ label: 'total', value: Number(invoice.total) });
  return rows;
}

export function getBillingAddress(
  invoice: InvoiceLike
): InvoiceSnapshotAddress | null {
  if (invoice.snapshot?.billing_address) return invoice.snapshot.billing_address;
  const legacy = (invoice as InvoiceDetail).billing_address;
  if (!legacy) return null;
  return {
    street: legacy.street ?? legacy.street_address ?? legacy.line1 ?? null,
    city: legacy.city ?? null,
    state: legacy.state ?? null,
    zip: legacy.postal_code ?? null,
    country: legacy.country ?? null,
  };
}

export function getShippingAddress(
  invoice: InvoiceLike
): InvoiceSnapshotAddress | null {
  if (invoice.snapshot?.shipping_address) return invoice.snapshot.shipping_address;
  const legacy = (invoice as InvoiceDetail).shipping_address;
  if (!legacy) return null;
  return {
    street: legacy.street ?? legacy.street_address ?? legacy.line1 ?? null,
    city: legacy.city ?? null,
    state: legacy.state ?? null,
    zip: legacy.postal_code ?? null,
    country: legacy.country ?? null,
  };
}

export interface InvoicePaymentView {
  method: string | null;
  gateway: string | null;
  paidAt: string | null;
}

export function getPaymentView(invoice: InvoiceLike): InvoicePaymentView {
  const snapshotPayment = invoice.snapshot?.payment;
  return {
    method:
      invoice.payment_method ?? snapshotPayment?.method ?? null,
    gateway: invoice.payment_gateway ?? snapshotPayment?.gateway ?? null,
    paidAt:
      snapshotPayment?.paid_at ??
      (invoice as InvoiceDetail).paid_at ??
      null,
  };
}

export function canDownloadPdf(invoice: InvoiceLike): boolean {
  return (
    invoice.status === 'ready' ||
    Boolean(invoice.download_url) ||
    Boolean(invoice.pdf_generated_at)
  );
}