import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bell, Inbox, RefreshCw, CheckCheck } from 'lucide-react';
import {
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/shared/ui/dropdown-menu';
import { Button } from '@/shared/ui/button';
import { useUnreadNotifications, useMarkAllAsRead } from '../hooks/use-notifications';
import { NotificationItem } from './notification-item';

export function NotificationDropdown() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useUnreadNotifications({ per_page: 5 });
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = data?.data?.data ?? [];
  const total = data?.data?.total ?? notifications.length;

  return (
    <DropdownMenuContent
      align="end"
      sideOffset={8}
      className="w-[380px] p-0"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          {t('notifications.title', 'Notifications')}
        </span>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs font-medium text-primary"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="size-3.5" />
            {t('notifications.markAllRead', 'Mark all read')}
          </Button>
        )}
      </div>

      <DropdownMenuSeparator className="mx-0" />

      <div className="max-h-[360px] overflow-y-auto">
        {isLoading && (
          <div className="space-y-3 px-4 py-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="size-8 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-full animate-pulse rounded bg-muted" />
                  <div className="h-2 w-1/4 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <RefreshCw className="size-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('notifications.loadError', 'Failed to load notifications')}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('notifications.tryAgain', 'Please try again')}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('notifications.retry', 'Retry')}
            </Button>
          </div>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Inbox className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('notifications.noNotifications', 'No notifications yet')}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('notifications.emptyDesc', "You're all caught up!")}
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && notifications.length > 0 && (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
            {total > 5 && (
              <div className="border-t px-2 py-1.5">
                <p className="px-2 text-xs text-muted-foreground">
                  {t('notifications.andMore', '+{{count}} more', {
                    count: total - 5,
                  })}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <DropdownMenuSeparator className="mx-0" />

      <DropdownMenuItem
        className="flex cursor-pointer items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary"
        onClick={() => {
          navigate('/notifications');
        }}
      >
        <Bell className="size-4" />
        {t('notifications.viewAll', 'View all notifications')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
