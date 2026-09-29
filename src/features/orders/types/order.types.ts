import type { LocalizedName } from '@/shared/lib/localize';

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
  store_name?: string | LocalizedName;
  name?: string | LocalizedName;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  latitude?: string | null;
  longitude?: string | null;
  working_hours?:
    | Array<{ day: string | LocalizedName; open: string; close: string }>
    | null;
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

export type OrdersListResponse = ApiResponse<PaginatedResponse<OrderListItem>>;
export type OrderDetailResponse = ApiResponse<OrderDetail>;
export type MyOrdersListResponse = ApiResponse<PaginatedResponse<MyOrderListItem>>;
export type UpdateOrderStatusResponse = ApiResponse<OrderDetail>;
export type StatusOptionsResponse = ApiResponse<StatusOptionsData>;
export type BatchStatusResponse = ApiResponse<BatchStatusData>;
export type FlowValues = Record<string, unknown>;

export type OrderStatus = string;

export interface LocalizedLabel {
  code: string;
  name: LocalizedName | string;
  sort_order?: number;
}

export type ShippingTypeName = 'local' | 'international';

export type StatusOptionReason =
  | 'forbidden_transition'
  | 'missing_permission'
  | 'inactive_status'
  | null;

export interface FlowStatusOption {
  code: string;
  name: LocalizedName;
  sort_order: number;
  transition_allowed: boolean;
  permitted: boolean;
  allowed: boolean;
  permission: string | null;
  reason: StatusOptionReason;
  requires_inputs: string[];
}

export interface StatusOptionsData {
  current_status: LocalizedLabel;
  flow: { code: string; shipping_type: 'local' | 'international' };
  statuses: FlowStatusOption[];
}

export type BatchErrorCode =
  | 'order_not_found'
  | 'missing_permission'
  | 'forbidden_transition'
  | 'missing_flow_input'
  | 'unknown_flow_input'
  | 'invalid_flow_input'
  | 'payment_permission_required'
  | 'internal_error';

export interface BatchOrderResult {
  order_id: number;
  success: boolean;
  status?: string;
  current_status?: { code: string; sort_order: number };
  error?: {
    code: BatchErrorCode;
    message: string;
    details?: { errors: Record<string, string[]> };
  };
}

export interface BatchStatusData {
  summary: { total: number; succeeded: number; failed: number };
  results: BatchOrderResult[];
}
