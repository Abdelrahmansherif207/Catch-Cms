import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchNotifications,
  fetchUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  type FetchNotificationsParams,
} from '../api/notifications.api';
import { useNotificationStore } from '../store/notification.store';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string) {
  const apiError = error as ApiErrorResponse;
  toast.error(apiError?.message || fallbackMessage);
}

export function useNotifications(params: FetchNotificationsParams = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => fetchNotifications(params),
  });
}

export function useUnreadNotifications(params: FetchNotificationsParams = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadList(params),
    queryFn: () => fetchUnreadNotifications(params),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();

  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count() });
      const unreadData = queryClient.getQueryData<{ data?: { total: number } }>(
        queryKeys.notifications.count(),
      );
      if (unreadData?.data?.total != null) {
        setUnreadCount(unreadData.data.total);
      }
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to mark notification as read');
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();

  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: (response) => {
      toast.success(response.message || 'All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      setUnreadCount(0);
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to mark all notifications as read');
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Notification deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete notification');
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();

  return useMutation({
    mutationFn: () => deleteAllNotifications(),
    onSuccess: (response) => {
      toast.success(response.message || 'All notifications deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      setUnreadCount(0);
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete all notifications');
    },
  });
}
