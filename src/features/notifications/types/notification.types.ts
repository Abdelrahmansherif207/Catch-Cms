export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  resource_type: string;
  resource_id: number;
  action_url: string;
  created_at: string;
  read_at: string | null;
}

export interface PaginatedNotificationData {
  data: NotificationItem[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface NotificationsListResponse {
  status: number;
  message: string;
  success: boolean;
  data: PaginatedNotificationData;
}

export interface NotificationSingleResponse {
  status: number;
  message: string;
  success: boolean;
  data: NotificationItem;
}

export interface MarkAllReadResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    marked_count: number;
  };
}

export interface DeleteAllResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    deleted_count: number;
  };
}

export interface SimpleSuccessResponse {
  status: number;
  message: string;
  success: boolean;
}
