import { axiosClient } from '@/shared/api';
import type {
  NotificationsListResponse,
  NotificationSingleResponse,
  MarkAllReadResponse,
  DeleteAllResponse,
  SimpleSuccessResponse,
} from '../types/notification.types';

export interface FetchNotificationsParams {
  page?: number;
  per_page?: number;
}

export async function fetchNotifications({
  page = 1,
  per_page = 15,
}: FetchNotificationsParams = {}): Promise<NotificationsListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', per_page.toString());
  const { data } = await axiosClient.get<NotificationsListResponse>(
    `/admin/notifications?${params.toString()}`,
  );
  return data;
}

export async function fetchUnreadNotifications({
  page = 1,
  per_page = 15,
}: FetchNotificationsParams = {}): Promise<NotificationsListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', per_page.toString());
  const { data } = await axiosClient.get<NotificationsListResponse>(
    `/admin/notifications/unread?${params.toString()}`,
  );
  return data;
}

export async function markAsRead(id: string): Promise<NotificationSingleResponse> {
  const { data } = await axiosClient.patch<NotificationSingleResponse>(
    `/admin/notifications/${id}/read`,
  );
  return data;
}

export async function markAllAsRead(): Promise<MarkAllReadResponse> {
  const { data } = await axiosClient.patch<MarkAllReadResponse>(
    '/admin/notifications/read-all',
  );
  return data;
}

export async function deleteNotification(id: string): Promise<SimpleSuccessResponse> {
  const { data } = await axiosClient.delete<SimpleSuccessResponse>(
    `/admin/notifications/${id}`,
  );
  return data;
}

export async function deleteAllNotifications(): Promise<DeleteAllResponse> {
  const { data } = await axiosClient.delete<DeleteAllResponse>(
    '/admin/notifications',
  );
  return data;
}
