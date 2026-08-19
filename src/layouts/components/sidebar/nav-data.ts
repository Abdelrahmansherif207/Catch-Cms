import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Tags,
  FolderTree,
  Settings,
  Star,
  Megaphone,
  FileText,
  Image,
  HelpCircle,
  Tag,
  Mail,
  List,
  ShieldCheck,
  History,
  MapPin,
  Bell,
  Globe,
  Building2,
  MapPinned,
  Hash,
  MessageSquare,
  Activity,
  Newspaper,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { SITE_REVIEW_PERMISSIONS } from '@/features/site-reviews/permissions/site-reviews.permissions';
import { STATIC_PAGE_PERMISSIONS } from '@/features/static-pages/permissions/static-pages.permissions';
import { INVOICE_PERMISSIONS } from '@/features/invoices/permissions/invoice.permissions';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permissions?: string[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export function useNavGroups(): NavGroup[] {
  const { t } = useTranslation();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const groups = [
    {
      title: t('sidebar.overview'),
      items: [
        { title: t('sidebar.dashboard'), url: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: t('sidebar.commerce'),
      items: [
        { title: t('sidebar.products'), url: '/products', icon: Package },
        { title: t('sidebar.orders'), url: '/orders', icon: ShoppingCart },
        {
          title: t('sidebar.invoices'),
          url: '/invoices',
          icon: Receipt,
          permissions: [INVOICE_PERMISSIONS.view],
        },
        { title: t('sidebar.pickupLocations'), url: '/pickup-locations', icon: MapPin },
        { title: t('sidebar.promotions'), url: '/promotions', icon: Megaphone },
        { title: t('sidebar.coupons'), url: '/coupons', icon: Tag },
      ],
    },
    {
      title: t('sidebar.catalog'),
      items: [
        { title: t('sidebar.categories'), url: '/categories', icon: FolderTree },
        { title: t('sidebar.brands'), url: '/brands', icon: Tags },
        { title: t('sidebar.tags'), url: '/tags', icon: Hash },
        { title: t('sidebar.attributes'), url: '/attributes', icon: List },
                { title: t('sidebar.reviews'), url: '/reviews', icon: Star },
        { title: t('sidebar.currencies'), url: '/currencies', icon: Globe },
        { title: t('sidebar.exchangeRates'), url: '/exchange-rates', icon: Activity },
      ],
    },
    {
      title: t('sidebar.content'),
      items: [
        { title: t('sidebar.cms'), url: '/cms', icon: FileText },
        {
          title: t('sidebar.staticPages'),
          url: '/static-pages',
          icon: Newspaper,
          permissions: [STATIC_PAGE_PERMISSIONS.view],
        },
        { title: t('sidebar.sliders'), url: '/sliders', icon: Image },
        { title: t('sidebar.banners'), url: '/banners', icon: Image },
        { title: t('sidebar.faqs'), url: '/faqs', icon: HelpCircle },
        { title: t('sidebar.flashSale'), url: '/flash-sale', icon: Megaphone },
        { title: t('sidebar.contacts'), url: '/contacts', icon: Mail },
        {
          title: t('sidebar.siteReviews'),
          url: '/site-reviews',
          icon: MessageSquare,
          permissions: [
            SITE_REVIEW_PERMISSIONS.view,
            SITE_REVIEW_PERMISSIONS.approve,
            SITE_REVIEW_PERMISSIONS.reject,
          ],
        },
      ],
    },
    {
      title: t('sidebar.shipping'),
      items: [
        { title: t('sidebar.countries'), url: '/shipping/countries', icon: Globe },
        { title: t('sidebar.governorates'), url: '/shipping/governorates', icon: Building2 },
        { title: t('sidebar.cities'), url: '/shipping/cities', icon: MapPinned },
      ],
    },
    {
      title: t('sidebar.system'),
      items: [
        { title: t('sidebar.users'), url: '/users', icon: Users },
        { title: t('sidebar.roles'), url: '/roles', icon: ShieldCheck },
        { title: t('sidebar.activityLogs'), url: '/activity-logs', icon: History },
        { title: t('sidebar.notifications'), url: '/notifications', icon: Bell },
{ title: t('sidebar.settings'), url: '/settings', icon: Settings },
      ],
    },
  ];

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permissions || item.permissions.some((p) => hasPermission(p))
      ),
    }))
    .filter((group) => group.items.length > 0);
}



