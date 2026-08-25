export interface PaginationLinks {
  current_page: number;
  from: number;
  to: number;
  last_page: number;
  path: string;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export type InvoiceStatus =
  | 'pending'
  | 'generating'
  | 'generated'
  | 'pdf_generating'
  | 'ready'
  | 'failed'
  | 'verified'
  | 'downloaded'
  | 'printed'
  | 'corrected'
  | 'cancelled'
  | 'archived';

export interface InvoiceAddress {
  name?: string;
  line1?: string;
  street?: string;
  street_address?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
}

export interface InvoiceItem {
  id: number;
  name?: string;
  product_id?: number;
  product_name?: string;
  sku?: string;
  product_sku?: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  discount?: number;
  total?: number;
  total_price?: number;
  line_total?: number;
}

export interface InvoiceTimelineEvent {
  id: number;
  status?: string;
  description?: string;
  created_at?: string;
}

export interface InvoiceNote {
  id: number;
  type?: 'debit' | 'credit' | string;
  number?: string;
  amount?: number;
  reason?: string;
  created_at?: string;
}

export interface InvoiceCorrection {
  id: number;
  invoice_number?: string;
  status?: string;
  created_at?: string;
}

export interface InvoicePaymentInfo {
  method?: string;
  gateway?: string;
  transaction_id?: string;
  paid_at?: string | null;
}

export interface InvoiceSnapshotAddress {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  governorate?: string | null;
  zip?: string | null;
  country?: string | null;
  coordinates?: string | null;
}

export interface InvoiceSnapshotOrder {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string | null;
}

export interface InvoiceSnapshotCustomer {
  name?: string | null;
}

export interface InvoiceSnapshotFulfillment {
  type?: string | null;
  shipping_method?: string | null;
  shipping_price?: number | null;
  fast_shipping_fee?: number | null;
  expected_delivery_at?: string | null;
}

export interface InvoiceSnapshotPickupLocation {
  id?: number | null;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  coordinates?: string | null;
}

export interface InvoiceSnapshotItem {
  product_name: string;
  product_sku: string;
  attributes?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_gift: boolean;
}

export interface InvoicePricingBreakdown {
  subtotal?: number | null;
  promotion_discount?: number | null;
  coupon_discount?: number | null;
  shipping_price?: number | null;
  fast_shipping_fee?: number | null;
  total?: number | null;
  currency?: string | null;
}

export interface InvoiceQrContent {
  uuid: string;
  invoice_number: string;
  verification_hash: string;
  issued_at: string;
  verification_url: string;
}

export interface InvoiceSnapshot {
  snapshot_version?: string;
  snapshot_schema?: number;
  order: InvoiceSnapshotOrder;
  customer: InvoiceSnapshotCustomer;
  billing_address: InvoiceSnapshotAddress | null;
  shipping_address: InvoiceSnapshotAddress | null;
  fulfillment: InvoiceSnapshotFulfillment;
  pickup_location?: InvoiceSnapshotPickupLocation | null;
  items: InvoiceSnapshotItem[];
  pricing_breakdown: InvoicePricingBreakdown;
  payment: InvoicePaymentInfo;
  metadata?: {
    system_version?: string | null;
    locale?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    generated_at?: string | null;
  } | null;
  audit?: {
    generated_by?: string | null;
    generated_at?: string | null;
  } | null;
}

export interface InvoiceListItem {
  id: number;
  uuid: string;
  invoice_number: string;
  order_id?: number | null;
  order_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  status: InvoiceStatus;
  subtotal?: number | null;
  shipping_price?: number | null;
  coupon_discount?: number | null;
  promotion_discount?: number | null;
  total_discount?: number | null;
  total: number;
  amount_paid?: number | null;
  currency?: string | null;
  payment_method?: string | null;
  payment_gateway?: string | null;
  snapshot_hash?: string | null;
  verification_hash?: string | null;
  pdf_generated_at?: string | null;
  generated_at?: string | null;
  generation_attempts?: number | null;
  last_generation_error?: string | null;
  is_correction?: boolean;
  correction_reason?: string | null;
  corrected_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  verified_at?: string | null;
  downloaded_at?: string | null;
  printed_at?: string | null;
  archived_at?: string | null;
  last_verified_at?: string | null;
  verify_count?: number | null;
  created_at: string;
  updated_at?: string | null;
  pdf_ready?: boolean;
  verification_url?: string | null;
  view_url?: string | null;
  qr_content?: InvoiceQrContent | null;
  download_url?: string | null;
}

export interface InvoiceDetail extends InvoiceListItem {
  discounts?: number;
  discount?: number;
  shipping?: number;
  customer?: { name?: string; email?: string; phone?: string };
  billing_address?: InvoiceAddress | null;
  shipping_address?: InvoiceAddress | null;
  items?: InvoiceItem[];
  payment?: InvoicePaymentInfo;
  transaction_id?: string | null;
  timeline?: InvoiceTimelineEvent[];
  audit_log?: InvoiceTimelineEvent[];
  notes?: string | null;
  notes_override?: string | null;
  debit_notes?: InvoiceNote[];
  credit_notes?: InvoiceNote[];
  original_id?: number | null;
  original_invoice_number?: string | null;
  corrections?: InvoiceCorrection[];
  correction_chain?: InvoiceCorrection[];
  issued_at?: string | null;
  paid_at?: string | null;
  due_at?: string | null;
  qr_url?: string | null;
  snapshot?: InvoiceSnapshot | null;
}

export interface InvoiceVerificationInvoice {
  uuid: string;
  invoice_number: string;
  status: InvoiceStatus | string;
  total?: number | null;
  currency?: string | null;
  verify_count?: number | null;
  view_url?: string | null;
}

export interface InvoiceVerificationOrder {
  id: number;
  order_number: string;
  status?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
}

export interface InvoiceVerificationResult {
  authentic?: boolean;
  tampered?: boolean;
  invoice?: InvoiceVerificationInvoice | null;
  order?: InvoiceVerificationOrder | null;
  qr_content?: string | null;
  message?: string;
}

export type InvoicesListResponse = ApiResponse<PaginatedResponse<InvoiceListItem>>;
export type InvoiceDetailResponse = ApiResponse<InvoiceDetail>;
export type InvoiceVerificationResponse = ApiResponse<InvoiceVerificationResult>;
export type RegenerateInvoiceResponse = ApiResponse<{ invoice_id: number; status: string }>;

export interface DebitNote {
  id: number;
  uuid?: string | null;
  invoice_id: number;
  debit_note_number?: string | null;
  debit_note_series?: string | null;
  sequence_number?: number | null;
  sequence_year?: number | null;
  reason?: string | null;
  type?: string | null;
  amount?: number | null;
  currency?: string | null;
  created_by?: number | null;
  notes?: string | null;
  issued_at?: string | null;
  created_at?: string | null;
}

export interface CorrectInvoiceOverrides {
  total?: number;
  amount_paid?: number;
  shipping_price?: number;
  customer?: { name?: string; email?: string; phone?: string };
  billing_address?: Record<string, string>;
  shipping_address?: Record<string, string>;
  notes?: string;
}

export interface CorrectInvoicePayload {
  reason: string;
  overrides?: CorrectInvoiceOverrides;
}

export interface CancelInvoicePayload {
  reason: string;
}

export interface DebitNotePayload {
  amount: number;
  reason: string;
}