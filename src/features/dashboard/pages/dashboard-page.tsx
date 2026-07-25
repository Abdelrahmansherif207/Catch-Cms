import { useTranslation } from 'react-i18next';
import {
  useDashboardOverview,
  useRevenue,
  useOrderStats,
  useRecentOrders,
  useTopProducts,
  useCategoryStats,
  useLowStock,
  useSales,
  useDashboardCustomers,
  useDashboardProducts,
  useDashboardOrders,
  useDashboardCategories,
  useDashboardCoupons,
  useDashboardCart,
  useDashboardFinance,
} from '../hooks/use-dashboard';
import { KpiCards } from '../components/kpi-cards';
import { RevenueChart } from '../components/revenue-chart';
import { OrderStatsChart } from '../components/order-stats-chart';
import { CategoryCharts } from '../components/category-charts';
import { RecentOrdersTable } from '../components/recent-orders-table';
import { TopProductsTable } from '../components/top-products-table';
import { LowStockAlerts } from '../components/low-stock-alerts';
import { SalesAnalytics } from '../components/sales-analytics';
import { CustomerAnalytics } from '../components/customer-analytics';
import { ProductAnalytics } from '../components/product-analytics';
import { OrderAnalytics } from '../components/order-analytics';
import { CategoryAnalytics } from '../components/category-analytics';
import { CouponAnalytics } from '../components/coupon-analytics';
import { CartAnalytics } from '../components/cart-analytics';
import { FinanceAnalytics } from '../components/finance-analytics';
import { PageSkeleton } from '../components/page-skeleton';

export function DashboardPage() {
  const { t } = useTranslation();

  const overview = useDashboardOverview();
  const revenue = useRevenue();
  const orderStats = useOrderStats();
  const recentOrders = useRecentOrders(10);
  const topProducts = useTopProducts(10);
  const categoryStats = useCategoryStats();
  const lowStock = useLowStock(10);
  const sales = useSales();
  const customers = useDashboardCustomers();
  const products = useDashboardProducts();
  const orders = useDashboardOrders();
  const categories = useDashboardCategories();
  const coupons = useDashboardCoupons();
  const cart = useDashboardCart();
  const finance = useDashboardFinance();

  const isAnyLoading =
    overview.isLoading ||
    revenue.isLoading ||
    orderStats.isLoading ||
    recentOrders.isLoading ||
    topProducts.isLoading ||
    categoryStats.isLoading ||
    lowStock.isLoading ||
    sales.isLoading ||
    customers.isLoading ||
    products.isLoading ||
    orders.isLoading ||
    categories.isLoading ||
    coupons.isLoading ||
    cart.isLoading ||
    finance.isLoading;

  if (isAnyLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('dashboard.pageTitle')}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.pageDescription')}
        </p>
      </div>

      {/* 1. KPI Summary Cards */}
      <KpiCards data={overview.data?.data} isLoading={overview.isLoading} error={overview.error} />

      {/* 2. Revenue Analytics */}
      <RevenueChart data={revenue.data?.data} isLoading={revenue.isLoading} error={revenue.error} />

      {/* 3. Sales Analytics */}
      <SalesAnalytics data={sales.data?.data} isLoading={sales.isLoading} error={sales.error} />

      {/* 4. Customer Analytics + 5. Product Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CustomerAnalytics data={customers.data?.data} isLoading={customers.isLoading} error={customers.error} />
        <ProductAnalytics data={products.data?.data} isLoading={products.isLoading} error={products.error} />
      </div>

      {/* 6. Order Analytics */}
      <OrderAnalytics data={orders.data?.data} isLoading={orders.isLoading} error={orders.error} />

      {/* 7. Category Stats + Order Stats side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <OrderStatsChart data={orderStats.data?.data} isLoading={orderStats.isLoading} error={orderStats.error} />
        <CategoryCharts data={categoryStats.data?.data} isLoading={categoryStats.isLoading} error={categoryStats.error} />
      </div>

      {/* 8. Category Analytics + 9. Coupon Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryAnalytics data={categories.data?.data} isLoading={categories.isLoading} error={categories.error} />
        <CouponAnalytics data={coupons.data?.data} isLoading={coupons.isLoading} error={coupons.error} />
      </div>

      {/* 10. Cart Analytics */}
      <CartAnalytics data={cart.data?.data} isLoading={cart.isLoading} error={cart.error} />

      {/* 11. Finance Analytics */}
      <FinanceAnalytics data={finance.data?.data} isLoading={finance.isLoading} error={finance.error} />

      {/* Recent Orders */}
      <RecentOrdersTable data={recentOrders.data?.data} isLoading={recentOrders.isLoading} error={recentOrders.error} />

      {/* Top Products + Low Stock Alerts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TopProductsTable data={topProducts.data?.data} isLoading={topProducts.isLoading} error={topProducts.error} />
        <LowStockAlerts data={lowStock.data?.data} isLoading={lowStock.isLoading} error={lowStock.error} />
      </div>
    </div>
  );
}
