import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import i18n from '@/shared/i18n';
import type {
  ApiResponse,
  DashboardOverview,
  MonthlyBreakdown,
  OrderUser,
  RecentOrder,
  RevenueData,
} from '@/features/dashboard/types/dashboard.types';

// ─── i18n ──────────────────────────────────────────────────────
// Importing '@/shared/i18n' registers all en/ar resources synchronously.
export async function initTestI18n(): Promise<typeof i18n> {
  await i18n.changeLanguage('en');
  return i18n;
}

// ─── Fake-data factories ───────────────────────────────────────
export function apiResponse<T>(data: T): ApiResponse<T> {
  return { success: true, message: 'OK', data };
}

export function buildOverview(overrides: Partial<DashboardOverview> = {}): DashboardOverview {
  return {
    total_revenue: 12345.67,
    todays_revenue: 500.5,
    total_refunds: 45,
    total_orders: 200,
    total_products: 300,
    total_customers: 1500,
    new_customers: 25,
    ...overrides,
  };
}

export function buildMonthlyBreakdown(overrides: Partial<MonthlyBreakdown> = {}): MonthlyBreakdown[] {
  return [
    { month: 'Jan', total: 1000, ...overrides },
    { month: 'Feb', total: 1200 },
    { month: 'Mar', total: 900 },
  ];
}

export function buildRevenue(overrides: Partial<RevenueData> = {}): RevenueData {
  return {
    total_revenue: 12345.67,
    todays_revenue: 500.5,
    monthly_breakdown: buildMonthlyBreakdown(),
    ...overrides,
  };
}

export function buildOrderUser(overrides: Partial<OrderUser> = {}): OrderUser {
  return {
    id: 7,
    name: { en: 'Jane Doe', ar: 'جين دو' },
    email: 'jane@example.com',
    ...overrides,
  };
}

export function buildRecentOrder(overrides: Partial<RecentOrder> = {}): RecentOrder {
  return {
    id: 101,
    name: '#101',
    status: 'completed',
    total_price: 99.98,
    created_at: '2026-05-15T10:30:00.000Z',
    products: [
      { id: 1, name: { en: 'T-Shirt', ar: 'تيشيرت' }, pivot: { product_quantity: 2 } },
    ],
    user: buildOrderUser(),
    ...overrides,
  };
}

export function buildRecentOrders(count: number, overrides: Partial<RecentOrder> = {}): RecentOrder[] {
  return Array.from({ length: count }, (_, i) => buildRecentOrder({ id: 101 + i, name: `#${101 + i}`, ...overrides }));
}

// ─── Query client ──────────────────────────────────────────────
// Fresh client per test: no retries (failures surface instantly) and no cache
// sharing between tests.
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export interface RenderPackages {
  client: QueryClient;
}

export function renderWithProviders(ui: ReactElement, client: QueryClient = createTestQueryClient()): RenderPackages {
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return { client };
}

export function renderHookWithProviders<TResult>(
  hook: () => TResult,
  client: QueryClient = createTestQueryClient()
) {
  const wrapper = ({ children }: { children?: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook<TResult, undefined>(hook, { wrapper }) };
}
