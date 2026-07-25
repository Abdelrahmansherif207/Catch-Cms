import type { LucideIcon } from 'lucide-react';
import {
  ShoppingCart,
  MessageCircle,
  User,
  Settings,
  AlertCircle,
  Bell,
  LogIn,
  Package,
  CreditCard,
  Star,
  Tag,
  Truck,
  Mail,
} from 'lucide-react';

export const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  'message-circle': MessageCircle,
  user: User,
  settings: Settings,
  'alert-circle': AlertCircle,
  bell: Bell,
  'log-in': LogIn,
  package: Package,
  'credit-card': CreditCard,
  star: Star,
  tag: Tag,
  truck: Truck,
  mail: Mail,
};

export function getNotificationIcon(iconName: string): LucideIcon {
  return NOTIFICATION_ICONS[iconName] || Bell;
}
