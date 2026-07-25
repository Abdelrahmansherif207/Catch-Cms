import { useCallback, createElement } from 'react';
import { useNavigate } from 'react-router';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import { getNotificationIcon } from '../lib/icons';
import { useMarkAsRead } from '../hooks/use-notifications';
import type { NotificationItem as NotificationItemType } from '../types/notification.types';

interface NotificationItemProps {
  notification: NotificationItemType;
  variant?: 'dropdown' | 'full';
  onClose?: () => void;
  onSelect?: (notification: NotificationItemType) => void;
}

export function NotificationItem({ notification, variant = 'dropdown', onClose, onSelect }: NotificationItemProps) {
  const navigate = useNavigate();
  const markAsReadMutation = useMarkAsRead();
  const isUnread = !notification.read_at;
  const IconComponent = getNotificationIcon(notification.icon);

  const handleClick = useCallback(() => {
    if (isUnread) {
      markAsReadMutation.mutate(notification.id);
    }

    if (variant === 'dropdown') {
      navigate('/notifications');
    } else {
      onSelect?.(notification);
    }

    onClose?.();
  }, [isUnread, notification.id, notification, variant, navigate, onClose, onSelect, markAsReadMutation]);

  const timeAgo = formatDistanceToNow(parseISO(notification.created_at), {
    addSuffix: true,
  });

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group flex w-full items-start gap-3 text-left transition-colors',
        variant === 'dropdown'
          ? 'px-3 py-2.5 hover:bg-accent/50'
          : 'rounded-lg border px-4 py-3 hover:bg-accent/30',
        isUnread && variant === 'dropdown' && 'bg-accent/20',
        isUnread && variant === 'full' && 'border-primary/20 bg-primary/[0.02]',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
          isUnread
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {createElement(IconComponent, { className: 'size-4' })}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm',
              isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            {notification.title}
          </p>
          {isUnread && (
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">{timeAgo}</p>
      </div>
    </button>
  );
}
