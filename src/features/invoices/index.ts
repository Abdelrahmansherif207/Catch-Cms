// Public API — features/invoices
// Exports: types, hooks, permissions, pages

export type {
  InvoiceStatus,
  InvoiceListItem,
  InvoiceDetail,
  InvoiceItem,
  InvoiceAddress,
  InvoicePaymentInfo,
  InvoiceTimelineEvent,
  InvoiceNote,
  InvoiceCorrection,
  InvoiceVerificationResult,
  InvoicesListResponse,
  InvoiceDetailResponse,
  InvoiceVerificationResponse,
  MyInvoicesListResponse,
  MyInvoiceResponse,
} from './types/invoice.types';

export { INVOICE_PERMISSIONS } from './permissions/invoice.permissions';

export {
  useInvoices,
  useInvoice,
  useRegenerateInvoice,
  useCorrectInvoice,
  useCancelInvoice,
  useIssueDebitNote,
  useInvoiceDownload,
  useMyInvoices,
  useMyInvoice,
  useVerifyInvoice,
} from './hooks/use-invoices';

export { InvoiceStatusBadge } from './components/invoice-status-badge';
export { InvoicePdfPanel } from './components/invoice-pdf-panel';

export {
  INVOICE_STATUSES,
  INVOICE_PAYMENT_METHODS,
  invoiceStatusStyles,
  isPdfPending,
  isPdfTerminal,
  isCancelable,
  canBeCorrected,
  formatMoney,
  formatDate,
  humanizeStatus,
} from './lib/invoice-utils';

export { invoiceRoutes } from './routes/invoice.routes';

export { InvoicesPage } from './pages/invoices-page';
export { InvoiceDetailPage } from './pages/invoice-detail-page';
export { InvoiceVerifyPage } from './pages/invoice-verify-page';
export { MyInvoicesPage } from './pages/my-invoices-page';
export { MyInvoiceDetailPage } from './pages/my-invoice-detail-page';