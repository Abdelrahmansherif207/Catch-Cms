import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  apiResponse,
  buildOverview,
  buildRecentOrders,
  buildRevenue,
  initTestI18n,
  renderWithProviders,
} from '@/test/mocks';

// ── Mock the API module: the page must render without any network ──
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

// ── Mock recharts: jsdom has no layout engine, so chart sizing breaks. ──
// We replace chart containers with passthrough divs and data primitives with
// null — the dashboard logic (cards, tables, loading/error states) remains real.
vi.mock('recharts', () => {
  const Container = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const Null = () => null;
  return {
    ResponsiveContainer: Container,
    LineChart: Container,
    BarChart: Container,
    PieChart: Container,
    RadarChart: Container,
    Line: Null,
    Bar: Null,
    Pie: Null,
    Radar: Null,
    Cell: Null,
    XAxis: Null,
    YAxis: Null,
    CartesianGrid: Null,
    Tooltip: Null,
    Legend: Null,
    PolarGrid: Null,
    PolarAngleAxis: Null,
    PolarRadiusAxis: Null,
  };
});

import * as api from '../api/dashboard.api';
import { DashboardPage } from '../pages/dashboard-page';

const m = vi.mocked(api);

function stubAllSuccess(): void {
  m.fetchDashboardOverview.mockResolvedValue(apiResponse(buildOverview()));
  m.fetchRevenue.mockResolvedValue(apiResponse(buildRevenue()));
  m.fetchOrderStats.mockResolvedValue(
    apiResponse({
      today: { pending: 2, processing: 1, completed: 5, cancelled: 1, refunded: 0, failed: 0, local_facility: 0, out_for_delivery: 0 },
      weekly: { pending: 3, processing: 2, completed: 9, cancelled: 0, refunded: 0, failed: 0, local_facility: 0, out_for_delivery: 0 },
      monthly: { pending: 3, processing: 2, completed: 9, cancelled: 1, refunded: 0, failed: 0, local_facility: 0, out_for_delivery: 0 },
      yearly: { pending: 3, processing: 2, completed: 9, cancelled: 1, refunded: 1, failed: 0, local_facility: 0, out_for_delivery: 0 },
    })
  );
  m.fetchRecentOrders.mockResolvedValue(apiResponse(buildRecentOrders(2)));
  m.fetchTopProducts.mockResolvedValue(apiResponse([]));
  m.fetchCategoryStats.mockResolvedValue(apiResponse({ product_distribution: [], sales_distribution: [] }));
  m.fetchLowStock.mockResolvedValue(apiResponse([]));
  m.fetchSales.mockResolvedValue(
    apiResponse({
      daily_revenue: { today: 100, yesterday: 80, last_7_days: 700, last_30_days: 3000 },
      revenue_comparison: {
        today_vs_yesterday: { today: 100, yesterday: 80, change: 25 },
        this_month_vs_last_month: { this_month: 1000, last_month: 900, change: 11.1 },
        this_year_vs_last_year: { this_year: 10000, last_year: 9000, change: 11.1 },
      },
      average_order_value: 85.5,
      revenue_by_payment_method: [],
    })
  );
  m.fetchCustomers.mockResolvedValue(
    apiResponse({
      new_vs_returning: { new_customers: 10, returning_customers: 5 },
      monthly_growth: [],
      top_customers: { by_orders: [], by_revenue: [] },
      customer_lifetime_value: [],
      active_customers: { last_7_days: 4, last_30_days: 12, last_90_days: 40 },
    })
  );
  m.fetchDashboardProducts.mockResolvedValue(
    apiResponse({
      best_selling: [],
      worst_selling: [],
      never_sold: [],
      out_of_stock: [],
      inventory_value: 5000,
    })
  );
  m.fetchDashboardOrders.mockResolvedValue(
    apiResponse({
      timeline: { daily: [], weekly: [], monthly: [] },
      success_rate: {
        completed: 80,
        cancelled: 10,
        refunded: 10,
        total: 100,
      },
      refund_rate: 10,
    })
  );
  m.fetchDashboardCategories.mockResolvedValue(
    apiResponse({ product_distribution: [], highest_revenue: [], lowest_revenue: [], category_growth: [] })
  );
  m.fetchDashboardCoupons.mockResolvedValue(
    apiResponse({ total_usage: 5, top_coupons: [], revenue_by_coupon: [] })
  );
  m.fetchDashboardCart.mockResolvedValue(
    apiResponse({
      abandonment_rate: 30,
      most_added_products: [],
      average_cart_value: 85.5,
      checkout_dropoff_rate: 20,
    })
  );
  m.fetchDashboardFinance.mockResolvedValue(
    apiResponse({
      gross_revenue: 1000,
      net_revenue: 800,
      refund_amount: 100,
      total_discount: 50,
      shipping_revenue: 50,
    })
  );
}

beforeAll(async () => {
  await initTestI18n();
});

describe('DashboardPage', () => {
  it('renders the page header and every analytics section', async () => {
    stubAllSuccess();

    renderWithProviders(<DashboardPage />);

    // Page header
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText("Welcome back. Here's an overview of your store.")).toBeInTheDocument();

    // Section titles are all rendered, each with its own loading state
    const expectedTitles = [
      'Revenue Analytics',
      'Sales Analytics',
      'Customer Analytics',
      'Product Analytics',
      'Order Analytics',
      'Category Analytics',
      'Coupon Analytics',
      'Cart Analytics',
      'Finance Analytics',
    ];
    for (const title of expectedTitles) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('shows real formatted KPI numbers once the overview query resolves', async () => {
    stubAllSuccess();

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      // $12,345.67 appears in the KPI card AND the Revenue section
      expect(screen.getAllByText('$12,345.67').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('renders the recent orders table rows', async () => {
    stubAllSuccess();

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('#101')).toBeInTheDocument();
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$99.98').length).toBeGreaterThan(0);
  });

  it('one failed endpoint does not block the other sections', async () => {
    stubAllSuccess();
    m.fetchLowStock
      .mockReset()
      .mockRejectedValue(new Error('low stock API down'));

    renderWithProviders(<DashboardPage />);

    // The failing section surfaces its error message
    expect(await screen.findByText('Failed to load data. Please try again.')).toBeInTheDocument();

    // ...while the healthy sections still render their data
    expect(await screen.findByText('#101')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });
});
