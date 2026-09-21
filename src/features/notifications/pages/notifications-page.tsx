import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RefreshCw,
  CheckCheck,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { DataEmptyState, DataErrorState } from '@/shared/components/data-state';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/shared/ui/dialog';
import {
  useNotifications,
  useUnreadNotifications,
  useMarkAllAsRead,
  useDeleteAllNotifications,
} from '../hooks/use-notifications';
import { useNotificationCount } from '../hooks/use-pusher';
import { NotificationItem } from '../components/notification-item';
import { NotificationDetailDialog } from '../components/notification-detail-dialog';
import type { NotificationItem as NotificationItemType } from '../types/notification.types';

type FilterTab = 'all' | 'unread';

export function NotificationsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItemType | null>(null);

  const unreadCount = useNotificationCount();

  const allQuery = useNotifications({ page, per_page: 15 });
  const unreadQuery = useUnreadNotifications({ page, per_page: 15 });
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteAllMutation = useDeleteAllNotifications();

  const currentQuery = tab === 'all' ? allQuery : unreadQuery;

  const handleTabChange = (value: string) => {
    setTab(value as FilterTab);
    setPage(1);
  };

  return (
    <>
      <div className="space-y-6">
      <PageHeader
        title={t('notifications.pageTitle', 'Notifications')}
        description={
          unreadCount > 0
            ? t('notifications.unreadSummary', '{{count}} unread notification', {
                count: unreadCount,
              })
            : t('notifications.allCaughtUp', "You're all caught up!")
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              {t('notifications.markAllRead', 'Mark all read')}
            </Button>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                <Trash2 className="size-4" />
                {t('notifications.deleteAll', 'Delete all')}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t('notifications.deleteConfirmTitle', 'Delete all notifications?')}
                  </DialogTitle>
                  <DialogDescription>
                    {t(
                      'notifications.deleteConfirmDesc',
                      'This action cannot be undone. All notifications will be permanently removed.',
                    )}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    {t('common.cancel', 'Cancel')}
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteAllMutation.mutate();
                      setDeleteDialogOpen(false);
                    }}
                    disabled={deleteAllMutation.isPending}
                  >
                    {deleteAllMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      t('notifications.deleteAll', 'Delete all')
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => currentQuery.refetch()}
              disabled={currentQuery.isFetching}
            >
              <RefreshCw
                className={`size-4 ${currentQuery.isFetching ? 'animate-spin' : ''}`}
              />
            </Button>
          </>
        }
      />

      <Tabs
        value={tab}
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="all">
            {t('notifications.all', 'All')}
          </TabsTrigger>
          <TabsTrigger value="unread">
            {t('notifications.unread', 'Unread')}
            {unreadCount > 0 && (
              <span className="ms-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-2xs font-semibold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <NotificationListContent
            query={allQuery}
            page={page}
            onPageChange={setPage}
            onSelect={setSelectedNotification}
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          <NotificationListContent
            query={unreadQuery}
            page={page}
            onPageChange={setPage}
            onSelect={setSelectedNotification}
          />
        </TabsContent>
      </Tabs>
    </div>

      <NotificationDetailDialog
        notification={selectedNotification}
        open={!!selectedNotification}
        onOpenChange={(open) => { if (!open) setSelectedNotification(null); }}
      />
    </>
  );
}

interface NotificationListContentProps {
  query: ReturnType<typeof useNotifications>;
  page: number;
  onPageChange: (page: number) => void;
  onSelect: (notification: NotificationItemType) => void;
}

function NotificationListContent({ query, page, onPageChange, onSelect }: NotificationListContentProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = query;

  const notifications = data?.data?.data ?? [];
  const pagination = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg px-4 py-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <DataErrorState
        message={t('notifications.loadError', 'Failed to load notifications')}
        onRetry={() => refetch()}
      />
    );
  }

  if (notifications.length === 0) {
    return (
      <DataEmptyState
        title={t('notifications.noNotifications', 'No notifications')}
        description={t('notifications.emptyDesc', "You're all caught up!")}
      />
    );
  }

  return (
    <div className="space-y-1">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          variant="full"
          onSelect={onSelect}
        />
      ))}

      {pagination && (
        <Pagination
          page={page}
          lastPage={pagination.last_page}
          total={pagination.total}
          from={pagination.from}
          to={pagination.to}
          perPage={pagination.per_page}
          onPageChange={onPageChange}
          className="py-4"
        />
      )}
    </div>
  );
}
