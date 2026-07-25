import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../store/notification.store';

const BLINK_INTERVAL_MS = 1000;

export function useNotificationTitle() {
  const { t } = useTranslation();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const originalTitle = useRef(document.title);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashIndex = useRef(false);

  useEffect(() => {
    originalTitle.current = document.title;
  }, []);

  useEffect(() => {
    if (!document.hidden || unreadCount === 0) {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
      document.title = originalTitle.current;
      flashIndex.current = false;
      return;
    }

    if (intervalId.current) return;

    intervalId.current = setInterval(() => {
      flashIndex.current = !flashIndex.current;
      document.title = flashIndex.current
        ? t('notifications.newNotification')
        : originalTitle.current;
    }, BLINK_INTERVAL_MS);

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
      document.title = originalTitle.current;
      flashIndex.current = false;
    };
  }, [unreadCount, t]);
}
