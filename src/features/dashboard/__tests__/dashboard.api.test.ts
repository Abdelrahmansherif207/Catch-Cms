import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiResponse } from '@/test/mocks';

// Replace the real axios client so no HTTP request is ever sent.
// Each test then asserts *which* endpoint + params the dashboard layer calls.
vi.mock('@/shared/api', () => ({
  axiosClient: { get: vi.fn() },
}));

import { axiosClient } from '@/shared/api';
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

const mockedGet = vi.mocked(axiosClient.get);

beforeEach(() => {
  mockedGet.mockReset();
  // every fetcher destructures `{ data }` from the axios response — make sure
  // a well-formed default response exists even when a test only asserts
  // the request args.
  mockedGet.mockResolvedValue({ data: apiResponse({}) } as never);
});

describe('dashboard api fetchers', () => {
  it('each fetcher calls its own endpoint and returns the payload', async () => {
    const cases: Array<{ call: () => Promise<unknown>; endpoint: string }> = [
      { call: fetchDashboardOverview, endpoint: '/dashboard/overview' },
      { call: fetchRevenue, endpoint: '/dashboard/revenue' },
      { call: fetchOrderStats, endpoint: '/dashboard/order-stats' },
      { call: fetchSales, endpoint: '/dashboard/sales' },
      { call: fetchCustomers, endpoint: '/dashboard/customers' },
      { call: fetchDashboardProducts, endpoint: '/dashboard/products' },
      { call: fetchDashboardOrders, endpoint: '/dashboard/orders' },
      { call: fetchDashboardCategories, endpoint: '/dashboard/categories' },
      { call: fetchDashboardCoupons, endpoint: '/dashboard/coupons' },
      { call: fetchDashboardCart, endpoint: '/dashboard/cart' },
      { call: fetchDashboardFinance, endpoint: '/dashboard/finance' },
    ];

    for (const { call, endpoint } of cases) {
      const fake = apiResponse({ hello: endpoint });
      mockedGet.mockResolvedValueOnce({ data: fake } as never);

      await expect(call()).resolves.toEqual(fake);
      expect(mockedGet).toHaveBeenCalledWith(endpoint);
    }
  });

  it('fetchRecentOrders requests /dashboard/recent-orders with the given limit', async () => {
    await fetchRecentOrders(5);
    expect(mockedGet).toHaveBeenCalledWith('/dashboard/recent-orders', { params: { limit: 5 } });
  });

  it('fetchRecentOrders defaults the limit to 10', async () => {
    await fetchRecentOrders();
    expect(mockedGet).toHaveBeenCalledWith('/dashboard/recent-orders', { params: { limit: 10 } });
  });

  it('fetchTopProducts requests /dashboard/top-products with the given limit', async () => {
    await fetchTopProducts(3);
    expect(mockedGet).toHaveBeenCalledWith('/dashboard/top-products', { params: { limit: 3 } });
  });

  it('fetchLowStock requests /dashboard/low-stock with the given limit', async () => {
    await fetchLowStock(8);
    expect(mockedGet).toHaveBeenCalledWith('/dashboard/low-stock', { params: { limit: 8 } });
  });

  it('fetchCategoryStats omits params when no language is given', async () => {
    await fetchCategoryStats();
    expect(mockedGet).toHaveBeenCalledWith('/dashboard/category-stats', { params: undefined });
  });

  it('fetchCategoryStats forwards the language param', async () => {
    await fetchCategoryStats('ar');
    expect(mockedGet).toHaveBeenCalledWith('/dashboard/category-stats', { params: { language: 'ar' } });
  });

  it('propagates request failures to the caller', async () => {
    mockedGet.mockRejectedValueOnce(new Error('network down'));
    await expect(fetchDashboardOverview()).rejects.toThrow('network down');
  });
});
