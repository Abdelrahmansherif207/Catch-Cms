import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AdminLayout } from "@/layouts/admin-layout";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { Loader2 } from "lucide-react";

const DashboardPage = lazy(() => import("@/features/dashboard/pages/dashboard-page").then(m => ({ default: m.DashboardPage })));
const CategoriesPage = lazy(() => import("@/features/categories/pages/categories-page").then(m => ({ default: m.CategoriesPage })));
const SettingsPage = lazy(() => import("@/features/settings/pages/settings-page").then(m => ({ default: m.SettingsPage })));
const BrandsPage = lazy(() => import("@/features/brands/pages/brands-page").then(m => ({ default: m.BrandsPage })));
const TagsPage = lazy(() => import("@/features/tags/pages/tags-page").then(m => ({ default: m.TagsPage })));
const CurrenciesPage = lazy(() => import("@/features/currencies/pages/currencies-page").then(m => ({ default: m.CurrenciesPage })));
const ExchangeRatesPage = lazy(() => import("@/features/currencies/pages/exchange-rates-page").then(m => ({ default: m.ExchangeRatesPage })));
const SlidersPage = lazy(() => import("@/features/sliders/pages/sliders-page").then(m => ({ default: m.SlidersPage })));
const FaqsPage = lazy(() => import("@/features/faqs/pages/faqs-page").then(m => ({ default: m.FaqsPage })));
const FlashSalePage = lazy(() => import("@/features/flash-sale/pages/flash-sale-page").then(m => ({ default: m.FlashSalePage })));
const CouponsPage = lazy(() => import("@/features/coupons/pages/coupons-page").then(m => ({ default: m.CouponsPage })));
const CouponEditPage = lazy(() => import("@/features/coupons").then(m => ({ default: m.CouponEditPage })));
const ContactsPage = lazy(() => import("@/features/contacts/pages/contacts-page").then(m => ({ default: m.ContactsPage })));
const UsersPage = lazy(() => import("@/features/users/pages/users-page").then(m => ({ default: m.UsersPage })));
const UserDetailPage = lazy(() => import("@/features/users/pages/user-detail-page").then(m => ({ default: m.UserDetailPage })));
const PromotionsPage = lazy(() => import("@/features/promotions/pages/promotions-page").then(m => ({ default: m.PromotionsPage })));
const AttributesPage = lazy(() => import("@/features/attributes/pages/attributes-page").then(m => ({ default: m.AttributesPage })));
const AttributeDetailPage = lazy(() => import("@/features/attributes/pages/attribute-detail-page").then(m => ({ default: m.AttributeDetailPage })));
const RolesPage = lazy(() => import("@/features/roles/pages/roles-page").then(m => ({ default: m.RolesPage })));
const RoleDetailPage = lazy(() => import("@/features/roles/pages/role-detail-page").then(m => ({ default: m.RoleDetailPage })));
const LoginPage = lazy(() => import("@/features/auth/pages/login-page").then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import("@/features/auth/pages/forgot-password-page").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/features/auth/pages/reset-password-page").then(m => ({ default: m.ResetPasswordPage })));
const ChangePasswordPage = lazy(() => import("@/features/auth/pages/change-password-page").then(m => ({ default: m.ChangePasswordPage })));
const ProfilePage = lazy(() => import("@/features/profile/pages/profile-page").then(m => ({ default: m.ProfilePage })));
const ProductsPage = lazy(() => import("@/features/products/pages/products-page").then(m => ({ default: m.ProductsPage })));
const CreateProductPage = lazy(() => import("@/features/products/pages/create-product-page").then(m => ({ default: m.CreateProductPage })));
const ProductDetailPage = lazy(() => import("@/features/products/pages/product-detail-page").then(m => ({ default: m.ProductDetailPage })));
const EditProductPage = lazy(() => import("@/features/products/pages/edit-product-page").then(m => ({ default: m.EditProductPage })));
const OrdersPage = lazy(() => import("@/features/orders/pages/orders-page").then(m => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import("@/features/orders/pages/order-detail-page").then(m => ({ default: m.OrderDetailPage })));
const MyOrdersPage = lazy(() => import("@/features/orders/pages/my-orders-page").then(m => ({ default: m.MyOrdersPage })));
const OrderInvoiceViewPage = lazy(() => import("@/features/orders/pages/order-invoice-view-page").then(m => ({ default: m.OrderInvoiceViewPage })));
const InvoicesPage = lazy(() => import("@/features/invoices/pages/invoices-page").then(m => ({ default: m.InvoicesPage })));
const InvoiceDetailPage = lazy(() => import("@/features/invoices/pages/invoice-detail-page").then(m => ({ default: m.InvoiceDetailPage })));
const MyInvoicesPage = lazy(() => import("@/features/invoices/pages/my-invoices-page").then(m => ({ default: m.MyInvoicesPage })));
const MyInvoiceDetailPage = lazy(() => import("@/features/invoices/pages/my-invoice-detail-page").then(m => ({ default: m.MyInvoiceDetailPage })));
const InvoiceVerifyPage = lazy(() => import("@/features/invoices/pages/invoice-verify-page").then(m => ({ default: m.InvoiceVerifyPage })));
const SectionsPage = lazy(() => import("@/features/cms/pages/sections-page").then(m => ({ default: m.SectionsPage })));
const StaticPagesPage = lazy(() => import("@/features/static-pages/pages/static-pages-page").then(m => ({ default: m.StaticPagesPage })));
const StaticPageDetailPage = lazy(() => import("@/features/static-pages/pages/static-page-detail-page").then(m => ({ default: m.StaticPageDetailPage })));
const StaticPagePreviewPage = lazy(() => import("@/features/static-pages/pages/static-page-preview-page").then(m => ({ default: m.StaticPagePreviewPage })));
const ActivityLogsPage = lazy(() => import("@/features/activity-logs/pages/activity-logs-page").then(m => ({ default: m.ActivityLogsPage })));
const NotificationsPage = lazy(() => import("@/features/notifications/pages/notifications-page").then(m => ({ default: m.NotificationsPage })));
const ReviewsPage = lazy(() => import("@/features/reviews/pages/reviews-page").then(m => ({ default: m.ReviewsPage })));
const SiteReviewsPage = lazy(() => import("@/features/site-reviews/pages/site-reviews-page").then(m => ({ default: m.SiteReviewsPage })));
const BannersPage = lazy(() => import("@/features/banners/pages/banners-page").then(m => ({ default: m.BannersPage })));
const PickupLocationsPage = lazy(() => import("@/features/pickup-locations/pages/pickup-locations-page").then(m => ({ default: m.PickupLocationsPage })));
const CountriesPage = lazy(() => import("@/features/shipping/pages/countries-page").then(m => ({ default: m.CountriesPage })));
const GovernoratesPage = lazy(() => import("@/features/shipping/pages/governorates-page").then(m => ({ default: m.GovernoratesPage })));
const CitiesPage = lazy(() => import("@/features/shipping/pages/cities-page").then(m => ({ default: m.CitiesPage })));

function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/products/create" element={<CreateProductPage />} />
              <Route path="/products/:id/edit" element={<EditProductPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/brands" element={<BrandsPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/sliders" element={<SlidersPage />} />
              <Route path="/faqs" element={<FaqsPage />} />
              <Route path="/flash-sale" element={<FlashSalePage />} />
              <Route path="/coupons" element={<CouponsPage />} />
              <Route path="/coupons/:id/edit" element={<CouponEditPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/attributes" element={<AttributesPage />} />
              <Route path="/attributes/:id" element={<AttributeDetailPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/roles/:id" element={<RoleDetailPage />} />
              <Route path="/cms" element={<SectionsPage />} />
              <Route path="/static-pages" element={<StaticPagesPage />} />
              <Route path="/static-pages/:slug" element={<StaticPageDetailPage />} />
              <Route path="/static-pages/:slug/preview" element={<StaticPagePreviewPage />} />
              <Route path="/activity-logs" element={<ActivityLogsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/site-reviews" element={<SiteReviewsPage />} />
              <Route path="/banners" element={<BannersPage />} />
              <Route path="/pickup-locations" element={<PickupLocationsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/shipping/countries" element={<CountriesPage />} />
              <Route path="/shipping/countries/:countryId/governorates" element={<GovernoratesPage />} />
              <Route path="/shipping/governorates" element={<GovernoratesPage />} />
              <Route path="/shipping/governorates/:governorateId/cities" element={<CitiesPage />} />
                            <Route path="/shipping/cities" element={<CitiesPage />} />
              <Route path="/currencies" element={<CurrenciesPage />} />
              <Route path="/exchange-rates" element={<ExchangeRatesPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/invoices/:uuid/verify" element={<InvoiceVerifyPage />} />
            <Route path="/my-invoices" element={<MyInvoicesPage />} />
            <Route path="/my-invoices/:uuid" element={<MyInvoiceDetailPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/my-orders/invoice/:uuid" element={<OrderInvoiceViewPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
