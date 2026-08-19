import { useEffect, useRef, createElement } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { queryKeys } from '@/shared/lib/query-keys';
import { initPusher, destroyPusher } from '../lib/pusher';
import { useNotificationStore } from '../store/notification.store';
import { fetchUnreadNotifications } from '../api/notifications.api';
import { getNotificationIcon } from '../lib/icons';
import { useNotificationTitle } from './use-notification-title';

const IS_DEV = import.meta.env.DEV;

function log(event: string, data?: unknown) {
  if (!IS_DEV) return;
  console.log(`[Pusher] ${event}`, data ?? '');
}

export function usePusher() {
  const { user, isAuthenticated } = useAuthStore();
  const { setUnreadCount, incrementUnreadCount } = useNotificationStore();

  useNotificationTitle();
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  useQuery({
    queryKey: queryKeys.notifications.count(),
    queryFn: async () => {
      const res = await fetchUnreadNotifications({ per_page: 1 });
      const count = res.data?.total ?? res.data?.data?.length ?? 0;
      log('Count query result', { count, raw: res.data });
      setUnreadCount(count);
      return count;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!isAuthenticated || initialized.current) return;

    const pusher = initPusher();
    initialized.current = true;

    const userId = (user as { id?: number }).id;
    if (userId) {
      pusher.subscribe(`private-users.${userId}`);
    }
    const adminChannel = pusher.subscribe('private-admin.notifications');

    // ── Admin login event ──
    adminChannel.bind('admin.logged.in', (data: Record<string, string>) => {
      log('admin.logged.in event', data);
      incrementUnreadCount();
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
        refetchType: 'all',
      });
      toast('Admin Login', {
        description: `${data.name} logged in`,
        icon: createElement(getNotificationIcon('log-in'), { className: 'size-4' }),
      });
    });

    // ── Actual notification broadcasts (NewOrder, NewContactMessage, etc.) ──
    const handleNotificationEvent = (data: Record<string, unknown>) => {
      log('Global event received', data);

      if (!data || !data.title) {
        log('Skipped (no title)', data);
        return;
      }

      const notification = data as Record<string, string>;
      const title = notification.title;
      const message = notification.message || '';
      const iconName = notification.icon || 'bell';

      log('Handling notification', { title, icon: iconName });

      incrementUnreadCount();

      // Re-fetch all notification queries immediately
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
        refetchType: 'all',
      });

      toast(title, {
        description: message,
        icon: createElement(getNotificationIcon(iconName), { className: 'size-4' }),
      });
    };

    adminChannel.bind_global(handleNotificationEvent);

    // ── Notifications on user-private channel ──
    if (userId) {
      const userChannel = pusher.channel(`private-users.${userId}`);
      if (userChannel) {
        userChannel.bind_global(handleNotificationEvent);
      }
    }

    return () => {
      destroyPusher();
      initialized.current = false;
    };
  }, [isAuthenticated, user, incrementUnreadCount, queryClient]);
}

export function useNotificationCount() {
  return useNotificationStore((state) => state.unreadCount);
}
