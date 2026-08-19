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
  total: number;
  currency?: string | null;
  payment_method?: string | null;
  created_at: string;
  updated_at?: string | null;
  pdf_ready?: boolean;
  verification_url?: string | null;
}

export interface InvoiceDetail extends InvoiceListItem {
  subtotal?: number;
  discounts?: number;
  discount?: number;
  shipping?: number;
  shipping_price?: number;
  amount_paid?: number;
  customer?: { name?: string; email?: string; phone?: string };
  billing_address?: InvoiceAddress | null;
  shipping_address?: InvoiceAddress | null;
  items?: InvoiceItem[];
  payment?: InvoicePaymentInfo;
  payment_method?: string | null;
  payment_gateway?: string | null;
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
  verification_url?: string | null;
}

export interface InvoiceVerificationResult {
  verified?: boolean;
  tampered?: boolean;
  invoice?: InvoiceDetail | null;
  qr_content?: string;
  message?: string;
}

export type InvoicesListResponse = ApiResponse<PaginatedResponse<InvoiceListItem>>;
export type InvoiceDetailResponse = ApiResponse<InvoiceDetail>;
export type InvoiceVerificationResponse = ApiResponse<InvoiceVerificationResult>;
export type MyInvoicesListResponse = ApiResponse<PaginatedResponse<InvoiceListItem>>;
export type MyInvoiceResponse = ApiResponse<InvoiceDetail>;

export interface CorrectInvoicePayload {
  reason: string;
  total?: number;
  amount_paid?: number;
  shipping?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: Partial<InvoiceAddress>;
  shipping_address?: Partial<InvoiceAddress>;
  notes?: string;
}

export interface CancelInvoicePayload {
  reason: string;
}

export interface DebitNotePayload {
  amount: number;
  reason: string;
}