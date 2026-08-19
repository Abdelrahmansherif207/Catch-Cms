import { axiosClient } from '@/shared/api';
import type {
  OverviewResponse,
  RevenueResponse,
  OrderStatsResponse,
  RecentOrdersResponse,
  TopProductsResponse,
  CategoryStatsResponse,
  LowStockResponse,
  SalesResponse,
  CustomersResponse,
  DashboardProductsResponse,
  DashboardOrdersResponse,
  DashboardCategoriesResponse,
  DashboardCouponsResponse,
  DashboardCartResponse,
  DashboardFinanceResponse,
} from '../types/dashboard.types';

export async function fetchDashboardOverview(): Promise<OverviewResponse> {
  const { data } = await axiosClient.get<OverviewResponse>('/dashboard/overview');
  return data;
}

export async function fetchRevenue(): Promise<RevenueResponse> {
  const { data } = await axiosClient.get<RevenueResponse>('/dashboard/revenue');
  return data;
}

export async function fetchOrderStats(): Promise<OrderStatsResponse> {
  const { data } = await axiosClient.get<OrderStatsResponse>('/dashboard/order-stats');
  return data;
}

export async function fetchRecentOrders(limit = 10): Promise<RecentOrdersResponse> {
  const { data } = await axiosClient.get<RecentOrdersResponse>('/dashboard/recent-orders', {
    params: { limit },
  });
  return data;
}

export async function fetchTopProducts(limit = 10): Promise<TopProductsResponse> {
  const { data } = await axiosClient.get<TopProductsResponse>('/dashboard/top-products', {
    params: { limit },
  });
  return data;
}

export async function fetchCategoryStats(language?: string): Promise<CategoryStatsResponse> {
  const { data } = await axiosClient.get<CategoryStatsResponse>('/dashboard/category-stats', {
    params: language ? { language } : undefined,
  });
  return data;
}

export async function fetchLowStock(limit = 10): Promise<LowStockResponse> {
  const { data } = await axiosClient.get<LowStockResponse>('/dashboard/low-stock', {
    params: { limit },
  });
  return data;
}

export async function fetchSales(): Promise<SalesResponse> {
  const { data } = await axiosClient.get<SalesResponse>('/dashboard/sales');
  return data;
}

export async function fetchCustomers(): Promise<CustomersResponse> {
  const { data } = await axiosClient.get<CustomersResponse>('/dashboard/customers');
  return data;
}

export async function fetchDashboardProducts(): Promise<DashboardProductsResponse> {
  const { data } = await axiosClient.get<DashboardProductsResponse>('/dashboard/products');
  return data;
}

export async function fetchDashboardOrders(): Promise<DashboardOrdersResponse> {
  const { data } = await axiosClient.get<DashboardOrdersResponse>('/dashboard/orders');
  return data;
}

export async function fetchDashboardCategories(): Promise<DashboardCategoriesResponse> {
  const { data } = await axiosClient.get<DashboardCategoriesResponse>('/dashboard/categories');
  return data;
}

export async function fetchDashboardCoupons(): Promise<DashboardCouponsResponse> {
  const { data } = await axiosClient.get<DashboardCouponsResponse>('/dashboard/coupons');
  return data;
}

export async function fetchDashboardCart(): Promise<DashboardCartResponse> {
  const { data } = await axiosClient.get<DashboardCartResponse>('/dashboard/cart');
  return data;
}

export async function fetchDashboardFinance(): Promise<DashboardFinanceResponse> {
  const { data } = await axiosClient.get<DashboardFinanceResponse>('/dashboard/finance');
  return data;
}
