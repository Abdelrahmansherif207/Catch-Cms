import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchDashboardOverview,
  fetchRevenue,
  fetchOrderStats,
  fetchRecentOrders,
  fetchTopProducts,
  fetchCategoryStats,
  fetchLowStock,
  fetchSales,
  fetchCustomers,
  fetchDashboardProducts,
  fetchDashboardOrders,
  fetchDashboardCategories,
  fetchDashboardCoupons,
  fetchDashboardCart,
  fetchDashboardFinance,
} from '../api/dashboard.api';

export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: fetchDashboardOverview,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRevenue() {
  return useQuery({
    queryKey: queryKeys.dashboard.revenue(),
    queryFn: fetchRevenue,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.orderStats(),
    queryFn: fetchOrderStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentOrders(limit = 10) {
  return useQuery({
    queryKey: queryKeys.dashboard.recentOrders(limit),
    queryFn: () => fetchRecentOrders(limit),
    staleTime: 60 * 1000,
  });
}

export function useTopProducts(limit = 10) {
  return useQuery({
    queryKey: queryKeys.dashboard.topProducts(limit),
    queryFn: () => fetchTopProducts(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryStats(language?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.categoryStats(language),
    queryFn: () => fetchCategoryStats(language),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLowStock(limit = 10) {
  return useQuery({
    queryKey: queryKeys.dashboard.lowStock(limit),
    queryFn: () => fetchLowStock(limit),
    staleTime: 60 * 1000,
  });
}

export function useSales() {
  return useQuery({
    queryKey: queryKeys.dashboard.sales(),
    queryFn: fetchSales,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardCustomers() {
  return useQuery({
    queryKey: queryKeys.dashboard.customers(),
    queryFn: fetchCustomers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardProducts() {
  return useQuery({
    queryKey: queryKeys.dashboard.dashboardProducts(),
    queryFn: fetchDashboardProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardOrders() {
  return useQuery({
    queryKey: queryKeys.dashboard.dashboardOrders(),
    queryFn: fetchDashboardOrders,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardCategories() {
  return useQuery({
    queryKey: queryKeys.dashboard.dashboardCategories(),
    queryFn: fetchDashboardCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardCoupons() {
  return useQuery({
    queryKey: queryKeys.dashboard.dashboardCoupons(),
    queryFn: fetchDashboardCoupons,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardCart() {
  return useQuery({
    queryKey: queryKeys.dashboard.dashboardCart(),
    queryFn: fetchDashboardCart,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardFinance() {
  return useQuery({
    queryKey: queryKeys.dashboard.dashboardFinance(),
    queryFn: fetchDashboardFinance,
    staleTime: 5 * 60 * 1000,
  });
}
