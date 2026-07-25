import { createElement } from 'react';
import { useNavigate } from 'react-router';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { getNotificationIcon } from '../lib/icons';
import type { NotificationItem } from '../types/notification.types';

interface NotificationDetailDialogProps {
  notification: NotificationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
}: NotificationDetailDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!notification) return null;

  const IconComponent = getNotificationIcon(notification.icon);
  const timeAgo = formatDistanceToNow(parseISO(notification.created_at), {
    addSuffix: true,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {createElement(IconComponent, { className: 'size-5' })}
            </span>
            <div>
              <DialogTitle className="text-base">{notification.title}</DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="sr-only">
          {t('notifications.detailDescription', 'Notification details')}
        </DialogDescription>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {notification.message}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">
                {t('notifications.resourceType', 'Resource')}
              </span>
              <p className="mt-0.5 font-medium capitalize text-foreground">
                {notification.resource_type}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t('notifications.resourceId', 'ID')}
              </span>
              <p className="mt-0.5 font-medium text-foreground">
                #{notification.resource_id}
              </p>
            </div>
          </div>

          {notification.action_url && (
            <Button
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                navigate(notification.action_url);
              }}
            >
              <ExternalLink className="size-4" />
              {t('notifications.viewResource', 'View details')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
