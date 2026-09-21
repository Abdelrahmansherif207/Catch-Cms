import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { FileOperationConnectionState } from '@/shared/lib/file-operations';

interface FileOpConnectionHintProps {
  connectionState: FileOperationConnectionState | undefined;
  className?: string;
}

/**
 * Live-connection awareness line. `live` = Pusher streaming (default, subtle).
 * Anything else = amber "Reconnecting — job keeps running" reassurance.
 */
export function FileOpConnectionHint({ connectionState, className }: FileOpConnectionHintProps) {
  const { t } = useTranslation();
  const live = connectionState === 'live' || connectionState === undefined;

  return (
    <p
      className={cn(
        'flex items-center justify-center gap-1.5 text-xs',
        live ? 'text-muted-foreground' : 'text-warning',
        className,
      )}
      aria-live="polite"
    >
      {live ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {live ? t('common.liveUpdates') : t('common.reconnectingHint')}
    </p>
  );
}
