import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import {
  apiResponse,
  buildOverview,
  buildRecentOrder,
  buildRevenue,
  renderHookWithProviders,
} from '@/test/mocks';

// Mock the whole API module so hooks never hit the network —
// the hooks are only TanStack Query wires around these functions.
vi.mock('../api/dashboard.api', () => {
  const viFn = () => vi.fn();
  return {
    fetchDashboardOverview: viFn(),
    fetchRevenue: viFn(),
    fetchOrderStats: viFn(),
    fetchRecentOrders: viFn(),
    fetchTopProducts: viFn(),
    fetchCategoryStats: viFn(),
    fetchLowStock: viFn(),
    fetchSales: viFn(),
    fetchCustomers: viFn(),
    fetchDashboardProducts: viFn(),
    fetchDashboardOrders: viFn(),
    fetchDashboardCategories: viFn(),
    fetchDashboardCoupons: viFn(),
    fetchDashboardCart: viFn(),
    fetchDashboardFinance: viFn(),
  };
});

import * as api from '../api/dashboard.api';
import {
  useDashboardOverview,
  useDashboardFinance,
  useRecentOrders,
  useRevenue,
} from '../hooks/use-dashboard';

describe('useDashboardOverview', () => {
  beforeEach(() => {
    vi.mocked(api.fetchDashboardOverview).mockReset();
  });

  it('is loading first, then exposes the fetched overview', async () => {
    vi.mocked(api.fetchDashboardOverview).mockResolvedValue(apiResponse(buildOverview()));

    const { result } = renderHookWithProviders(() => useDashboardOverview());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual(buildOverview());
    expect(api.fetchDashboardOverview).toHaveBeenCalledTimes(1);
  });

  it('surfaces API failures via the error field', async () => {
    vi.mocked(api.fetchDashboardOverview)
      .mockReset()
      .mockRejectedValue(new Error('boom'));

    const { result } = renderHookWithProviders(() => useDashboardOverview());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeUndefined();
  });
});

describe('useRevenue', () => {
  it('returns the revenue payload', async () => {
    vi.mocked(api.fetchRevenue).mockResolvedValue(apiResponse(buildRevenue()));

    const { result } = renderHookWithProviders(() => useRevenue());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.monthly_breakdown).toHaveLength(3);
    expect(result.current.data?.data.total_revenue).toBe(12345.67);
  });
});

describe('useRecentOrders', () => {
  it('forwards the requested limit to the api call', async () => {
    vi.mocked(api.fetchRecentOrders).mockResolvedValue(apiResponse([buildRecentOrder()]));

    const { result } = renderHookWithProviders(() => useRecentOrders(5));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.fetchRecentOrders).toHaveBeenCalledWith(5);
    expect(result.current.data?.data).toHaveLength(1);
  });
});

describe('useDashboardFinance', () => {
  it('returns the finance payload', async () => {
    vi.mocked(api.fetchDashboardFinance).mockResolvedValue(
      apiResponse({
        gross_revenue: 1000,
        net_revenue: 800,
        refund_amount: 100,
        total_discount: 50,
        shipping_revenue: 50,
      })
    );

    const { result } = renderHookWithProviders(() => useDashboardFinance());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.net_revenue).toBe(800);
  });
});
