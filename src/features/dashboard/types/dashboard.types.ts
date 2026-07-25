export interface LocalizedName {
  en: string;
  ar: string;
}

export type LocalizedField = string | LocalizedName;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── 1. Overview ─────────────────────────────────────────────

export interface DashboardOverview {
  total_revenue: number;
  todays_revenue: number;
  total_refunds: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
  new_customers: number;
}

// ─── 2. Revenue ──────────────────────────────────────────────

export interface MonthlyBreakdown {
  month: string;
  total: number;
}

export interface RevenueData {
  total_revenue: number;
  todays_revenue: number;
  monthly_breakdown: MonthlyBreakdown[];
}

// ─── 3. Order Stats ──────────────────────────────────────────

export interface OrderStats {
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  refunded: number;
  failed: number;
  local_facility: number;
  out_for_delivery: number;
}

export interface OrderStatsData {
  today: OrderStats;
  weekly: OrderStats;
  monthly: OrderStats;
  yearly: OrderStats;
}

// ─── 4. Recent Orders ────────────────────────────────────────

export interface OrderProduct {
  id: number;
  name: LocalizedField;
  pivot: { product_quantity: number };
}

export interface OrderUser {
  id: number;
  name: LocalizedField;
  email: string;
}

export interface RecentOrder {
  id: number;
  name: string;
  status: string;
  total_price: number;
  created_at: string;
  products: OrderProduct[];
  user: OrderUser;
}

// ─── 5. Top Products ─────────────────────────────────────────

export interface TopProduct {
  id: number;
  name: LocalizedField;
  slug: string;
  price: number;
  sold_quantity: number;
}

// ─── 6. Category Stats ───────────────────────────────────────

export interface CategoryDistItem {
  category_id: number;
  category_name: string;
  product_count: number;
}

export interface CategorySalesItem {
  category_id: number;
  category_name: string;
  total_sales: number;
}

export interface CategoryStatsData {
  product_distribution: CategoryDistItem[];
  sales_distribution: CategorySalesItem[];
}

// ─── 7. Low Stock ────────────────────────────────────────────

export interface ProductType {
  id: number;
  name: LocalizedField;
}

export interface LowStockProduct {
  id: number;
  name: LocalizedField;
  slug: string;
  quantity: number;
  price: number;
  type: ProductType;
}

// ─── 8. Sales Analytics ──────────────────────────────────────

export interface DailyRevenue {
  today: number;
  yesterday: number;
  last_7_days: number;
  last_30_days: number;
}

export interface RevenueComparison {
  today_vs_yesterday: { today: number; yesterday: number; change: number };
  this_month_vs_last_month: { this_month: number; last_month: number; change: number };
  this_year_vs_last_year: { this_year: number; last_year: number; change: number };
}

export interface PaymentMethodRevenue {
  method: LocalizedField;
  total: number;
}

export interface SalesData {
  daily_revenue: DailyRevenue;
  revenue_comparison: RevenueComparison;
  average_order_value: number;
  revenue_by_payment_method: PaymentMethodRevenue[];
}

// ─── 9. Customer Analytics ───────────────────────────────────

export interface NewVsReturning {
  new_customers: number;
  returning_customers: number;
}

export interface MonthlyGrowth {
  month: string;
  count: number;
}

export interface TopCustomerEntry {
  id: number;
  name: LocalizedField;
  email: string;
  orders?: number;
  revenue?: number;
}

export interface TopCustomers {
  by_orders: TopCustomerEntry[];
  by_revenue: TopCustomerEntry[];
}

export interface ClvEntry {
  id: number;
  name: LocalizedField;
  email: string;
  lifetime_value: number;
}

export interface ActiveCustomers {
  last_7_days: number;
  last_30_days: number;
  last_90_days: number;
}

export interface CustomerData {
  new_vs_returning: NewVsReturning;
  monthly_growth: MonthlyGrowth[];
  top_customers: TopCustomers;
  customer_lifetime_value: ClvEntry[];
  active_customers: ActiveCustomers;
}

// ─── 10. Product Analytics ────────────────────────────────────

export interface DashboardProductItem {
  id: number;
  name: LocalizedField;
  slug: string;
  price: number | string;
  sold_quantity?: number;
  quantity?: number;
  current_price?: number;
  price_after_discount?: number | null;
  price_after_flash_sale?: number | null;
  final_price?: number;
}

export interface DashboardProductsData {
  best_selling: DashboardProductItem[];
  worst_selling: DashboardProductItem[];
  never_sold: DashboardProductItem[];
  out_of_stock: DashboardProductItem[];
  inventory_value: number;
}

// ─── 11. Order Analytics ─────────────────────────────────────

export interface TimelineEntry {
  date?: string;
  week?: number;
  month?: string;
  orders: number;
  revenue: number;
}

export interface OrderTimeline {
  daily: TimelineEntry[];
  weekly: TimelineEntry[];
  monthly: TimelineEntry[];
}

export interface SuccessRate {
  completed: number;
  cancelled: number;
  refunded: number;
  total: number;
}

export interface DashboardOrdersData {
  timeline: OrderTimeline;
  success_rate: SuccessRate;
  refund_rate: number;
}

// ─── 12. Category Analytics ──────────────────────────────────

export interface CategoryDistEntry {
  category_id: number;
  category_name: string;
  product_count: number;
}

export interface CategoryRevenueEntry {
  category_id: number;
  category_name: string;
  revenue: number;
}

export interface CategoryGrowthEntry {
  category_id: number;
  category_name: string;
  current_month: number;
  previous_month: number;
  change: number;
}

export interface DashboardCategoriesData {
  product_distribution: CategoryDistEntry[];
  highest_revenue: CategoryRevenueEntry[];
  lowest_revenue: CategoryRevenueEntry[];
  category_growth: CategoryGrowthEntry[];
}

// ─── 13. Coupon Analytics ────────────────────────────────────

export interface TopCouponEntry {
  id: number;
  code: string;
  name: LocalizedField;
  usage_count: number;
}

export interface CouponRevenueEntry {
  code: string;
  revenue: number;
}

export interface DashboardCouponsData {
  total_usage: number;
  top_coupons: TopCouponEntry[];
  revenue_by_coupon: CouponRevenueEntry[];
  total_discount: number;
}

// ─── 14. Cart Analytics ──────────────────────────────────────

export interface CartProductEntry {
  id: number;
  name: LocalizedField;
  slug: string;
  price: number;
  total_added: number;
}

export interface DashboardCartData {
  abandonment_rate: number;
  most_added_products: CartProductEntry[];
  average_cart_value: number;
  checkout_dropoff_rate: number;
}

// ─── 15. Finance Analytics ───────────────────────────────────

export interface DashboardFinanceData {
  gross_revenue: number;
  net_revenue: number;
  refund_amount: number;
  total_discount: number;
  shipping_revenue: number;
}

// ─── Response Type Aliases ───────────────────────────────────

export type OverviewResponse = ApiResponse<DashboardOverview>;
export type RevenueResponse = ApiResponse<RevenueData>;
export type OrderStatsResponse = ApiResponse<OrderStatsData>;
export type RecentOrdersResponse = ApiResponse<RecentOrder[]>;
export type TopProductsResponse = ApiResponse<TopProduct[]>;
export type CategoryStatsResponse = ApiResponse<CategoryStatsData>;
export type LowStockResponse = ApiResponse<LowStockProduct[]>;
export type SalesResponse = ApiResponse<SalesData>;
export type CustomersResponse = ApiResponse<CustomerData>;
export type DashboardProductsResponse = ApiResponse<DashboardProductsData>;
export type DashboardOrdersResponse = ApiResponse<DashboardOrdersData>;
export type DashboardCategoriesResponse = ApiResponse<DashboardCategoriesData>;
export type DashboardCouponsResponse = ApiResponse<DashboardCouponsData>;
export type DashboardCartResponse = ApiResponse<DashboardCartData>;
export type DashboardFinanceResponse = ApiResponse<DashboardFinanceData>;
