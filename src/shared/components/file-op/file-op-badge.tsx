import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

export type FileOpBadgeState =
  | 'pending'
  | 'processing'
  | 'cancelling'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled';

interface FileOpBadgeProps {
  state: FileOpBadgeState | string | null | undefined;
  hasErrors?: boolean;
  live?: boolean;
  className?: string;
}

/**
 * Single status badge for every import/export dialog. Driven by the backend
 * lifecycle state (Pusher `state` / status API `status`) — never by timers.
 */
export function FileOpBadge({ state, hasErrors, live, className }: FileOpBadgeProps) {
  const { t } = useTranslation();

  let label = t('common.queued');
  let tone =
    'bg-muted text-muted-foreground dark:bg-muted/50 dark:text-muted-foreground';

  switch (state) {
    case 'processing':
      label = t('common.liveProcessing');
      tone = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      break;
    case 'cancelling':
      label = t('common.cancellingOp');
      tone = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      break;
    case 'completed':
      if (hasErrors) {
        label = t('common.completedWithErrors');
        tone = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      } else {
        label = t('common.completedOp');
        tone = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      }
      break;
    case 'completed_with_errors':
      label = t('common.completedWithErrors');
      tone = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      break;
    case 'failed':
      label = t('common.failedOp');
      tone = '';
      break;
    case 'cancelled':
      label = t('common.cancelledOp');
      break;
    case 'pending':
    default:
      break;
  }

  const isFailed = state === 'failed';
  const showPulse = live && (state === 'processing' || state === 'pending');

  return (
    <Badge
      variant={isFailed ? 'destructive' : 'outline'}
      className={cn('gap-1.5 text-xs font-normal', !isFailed && tone, className)}
    >
      {showPulse && (
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-current" />
        </span>
      )}
      {label}
    </Badge>
  );
}
