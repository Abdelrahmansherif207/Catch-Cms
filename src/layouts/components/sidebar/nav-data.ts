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
import { PERMISSIONS, type Permission } from '@/shared/auth/permissions';
import { usePermissions } from '@/shared/auth/guards';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Any-of grant list — item is hidden unless at least one is held. */
  permissions?: Permission[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export function useNavGroups(): NavGroup[] {
  const { t } = useTranslation();
  const { can } = usePermissions();

  const groups: NavGroup[] = [
    {
      title: t('sidebar.overview'),
      items: [
        { title: t('sidebar.dashboard'), url: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: t('sidebar.commerce'),
      items: [
        {
          title: t('sidebar.products'),
          url: '/products',
          icon: Package,
          permissions: [PERMISSIONS.products.view],
        },
        {
          title: t('sidebar.orders'),
          url: '/orders',
          icon: ShoppingCart,
          permissions: [PERMISSIONS.orders.view],
        },
        {
          title: t('sidebar.invoices'),
          url: '/invoices',
          icon: Receipt,
          permissions: [PERMISSIONS.invoices.view],
        },
        {
          title: t('sidebar.pickupLocations'),
          url: '/pickup-locations',
          icon: MapPin,
          permissions: [PERMISSIONS.pickupLocations.view],
        },
        {
          title: t('sidebar.promotions'),
          url: '/promotions',
          icon: Megaphone,
          permissions: [PERMISSIONS.promotions.view],
        },
        {
          title: t('sidebar.coupons'),
          url: '/coupons',
          icon: Tag,
          permissions: [PERMISSIONS.coupons.view],
        },
      ],
    },
    {
      title: t('sidebar.catalog'),
      items: [
        {
          title: t('sidebar.categories'),
          url: '/categories',
          icon: FolderTree,
          permissions: [PERMISSIONS.categories.view],
        },
        {
          title: t('sidebar.brands'),
          url: '/brands',
          icon: Tags,
          permissions: [PERMISSIONS.brands.view],
        },
        {
          title: t('sidebar.tags'),
          url: '/tags',
          icon: Hash,
          permissions: [PERMISSIONS.tags.view],
        },
        {
          title: t('sidebar.attributes'),
          url: '/attributes',
          icon: List,
          permissions: [PERMISSIONS.attributes.view],
        },
        {
          title: t('sidebar.reviews'),
          url: '/reviews',
          icon: Star,
          permissions: [PERMISSIONS.reviews.approve, PERMISSIONS.reviews.delete],
        },
        {
          title: t('sidebar.currencies'),
          url: '/currencies',
          icon: Globe,
          permissions: [PERMISSIONS.currencies.view],
        },
        {
          title: t('sidebar.exchangeRates'),
          url: '/exchange-rates',
          icon: Activity,
          permissions: [PERMISSIONS.exchangeRates.view],
        },
      ],
    },
    {
      title: t('sidebar.content'),
      items: [
        {
          title: t('sidebar.cms'),
          url: '/cms',
          icon: FileText,
          permissions: [PERMISSIONS.sections.view],
        },
        {
          title: t('sidebar.staticPages'),
          url: '/static-pages',
          icon: Newspaper,
          permissions: [PERMISSIONS.staticPages.view],
        },
        {
          title: t('sidebar.sliders'),
          url: '/sliders',
          icon: Image,
          permissions: [PERMISSIONS.sliders.view],
        },
        {
          title: t('sidebar.banners'),
          url: '/banners',
          icon: Image,
          permissions: [PERMISSIONS.banners.view],
        },
        {
          title: t('sidebar.faqs'),
          url: '/faqs',
          icon: HelpCircle,
          permissions: [PERMISSIONS.faqs.view],
        },
        {
          title: t('sidebar.flashSale'),
          url: '/flash-sale',
          icon: Megaphone,
          permissions: [PERMISSIONS.flashSale.view],
        },
        {
          title: t('sidebar.contacts'),
          url: '/contacts',
          icon: Mail,
          permissions: [PERMISSIONS.contacts.view],
        },
        {
          title: t('sidebar.siteReviews'),
          url: '/site-reviews',
          icon: MessageSquare,
          permissions: [
            PERMISSIONS.siteReviews.view,
            PERMISSIONS.siteReviews.approve,
            PERMISSIONS.siteReviews.reject,
          ],
        },
      ],
    },
    {
      title: t('sidebar.shipping'),
      items: [
        {
          title: t('sidebar.countries'),
          url: '/shipping/countries',
          icon: Globe,
          permissions: [PERMISSIONS.shipping.countriesView],
        },
        {
          title: t('sidebar.governorates'),
          url: '/shipping/governorates',
          icon: Building2,
          permissions: [PERMISSIONS.shipping.governoratesView],
        },
        {
          title: t('sidebar.cities'),
          url: '/shipping/cities',
          icon: MapPinned,
          permissions: [PERMISSIONS.shipping.citiesView],
        },
      ],
    },
    {
      title: t('sidebar.system'),
      items: [
        {
          title: t('sidebar.users'),
          url: '/users',
          icon: Users,
          permissions: [PERMISSIONS.users.view],
        },
        {
          title: t('sidebar.roles'),
          url: '/roles',
          icon: ShieldCheck,
          permissions: [PERMISSIONS.roles.view],
        },
        {
          title: t('sidebar.activityLogs'),
          url: '/activity-logs',
          icon: History,
          permissions: [PERMISSIONS.activityLogs.view],
        },
        {
          title: t('sidebar.notifications'),
          url: '/notifications',
          icon: Bell,
          permissions: [PERMISSIONS.notifications.view],
        },
        {
          title: t('sidebar.settings'),
          url: '/settings',
          icon: Settings,
          permissions: [PERMISSIONS.settings.view],
        },
      ],
    },
  ];

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permissions || item.permissions.some((p) => can(p))
      ),
    }))
    .filter((group) => group.items.length > 0);
}
