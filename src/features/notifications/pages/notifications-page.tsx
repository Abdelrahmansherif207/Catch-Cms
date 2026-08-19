import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Inbox,
  RefreshCw,
  CheckCheck,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Pagination } from '@/shared/components/pagination';
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('notifications.pageTitle', 'Notifications')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {unreadCount > 0
              ? t('notifications.unreadSummary', '{{count}} unread notification', {
                  count: unreadCount,
                })
              : t('notifications.allCaughtUp', "You're all caught up!")}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

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
              <span className="ml-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
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
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-4 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <RefreshCw className="size-6 text-destructive" />
        </div>
        <div>
          <p className="text-base font-medium text-foreground">
            {t('notifications.loadError', 'Failed to load notifications')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('notifications.tryAgain', 'Please try again')}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          {t('notifications.retry', 'Try again')}
        </Button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Inbox className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-base font-medium text-foreground">
            {t('notifications.noNotifications', 'No notifications')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('notifications.emptyDesc', "You're all caught up!")}
          </p>
        </div>
      </div>
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
