import { cn } from '@/shared/lib/utils';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800',
  completed: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800',
  cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800',
  delivered: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
};

const paymentStyles: Record<string, string> = {
  'payment-success': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800',
  'payment-pending': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800',
  'payment-failed': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800',
};

interface OrderStatusBadgeProps {
  status: string;
  type?: 'order' | 'payment';
}

export function OrderStatusBadge({ status, type = 'order' }: OrderStatusBadgeProps) {
  const styles = type === 'payment' ? paymentStyles : statusStyles;
  const className = styles[status] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800';

  const label = status
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        className
      )}
    >
      {label}
    </span>
  );
}
