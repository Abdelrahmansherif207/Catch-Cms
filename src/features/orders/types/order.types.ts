import type { InvoiceDetail } from '@/features/invoices/types/invoice.types';

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

export interface OrderCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface OrderListItem {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  shipping_method: string;
  customer: OrderCustomer;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_variant_id: number | null;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_price: number;
  flash_sale_price: number | null;
  promotion_discount_amount: number;
  is_gift: boolean;
  promotion_id: number | null;
  attributes: string | null;
}

export interface Transaction {
  id: number;
  invoice_id: number;
  payment_method: string;
  created_at: string;
}

export interface OrderPickupLocation {
  id?: number;
  store_name?: string;
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  latitude?: string | null;
  longitude?: string | null;
  working_hours?: Array<{ day: string; open: string; close: string }> | null;
}

export interface OrderDetail {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  shipping_method: string;
  customer: OrderCustomer;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  notes: string | null;
  price: number;
  shipping_price: number | null;
  total_price: number;
  coupon: unknown | null;
  coupon_discount: number | null;
  promotion: unknown | null;
  order_items: OrderItem[];
  transactions: Transaction[];
  pickup_location?: OrderPickupLocation | null;
  is_pickup?: boolean;
  delivery_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MyOrderListItem {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total?: number | null;
  price?: number | null;
  total_price?: number | null;
  currency?: string | null;
  order_has_invoice?: boolean;
  invoice_id?: number | string | null;
  invoice_uuid?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface OrderInvoiceView {
  invoice?: InvoiceDetail | null;
  snapshot?: unknown;
  verification_url?: string | null;
  verified?: boolean;
  tampered?: boolean;
  message?: string;
  invoice_number?: string;
  order_number?: string;
  status?: string;
  total?: number | null;
  currency?: string | null;
  created_at?: string;
}

export type OrdersListResponse = ApiResponse<PaginatedResponse<OrderListItem>>;
export type OrderDetailResponse = ApiResponse<OrderDetail>;
export type MyOrdersListResponse = ApiResponse<PaginatedResponse<MyOrderListItem>>;
export type OrderInvoiceResponse = ApiResponse<OrderInvoiceView>;
