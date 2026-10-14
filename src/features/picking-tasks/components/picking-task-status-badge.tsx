import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { PickingTaskStatus } from '../types/picking-task.types';

interface PickingTaskStatusBadgeProps {
  status: PickingTaskStatus | string;
  className?: string;
}

type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

/** Six-state pool mapped onto the five semantic soft tones. */
const TONES: Record<PickingTaskStatus, Tone> = {
  pending: 'warning',
  assigned: 'info',
  picking: 'info',
  picked: 'success',
  skipped: 'muted',
  cancelled: 'destructive',
};

const TONE_CLASSES: Record<Tone, string> = {
  success: 'border-transparent bg-success-soft text-success',
  warning: 'border-transparent bg-warning-soft text-warning',
  destructive: 'border-transparent bg-destructive-soft text-destructive',
  info: 'border-transparent bg-info-soft text-info',
  muted: 'border-transparent bg-muted text-muted-foreground',
};

export function PickingTaskStatusBadge({
  status,
  className,
}: PickingTaskStatusBadgeProps) {
  const { t } = useTranslation();
  const tone = TONES[(status || 'pending') as PickingTaskStatus] ?? 'muted';

  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone], className)}>
      {t('pickingTasks.status.' + status, { defaultValue: status })}
    </Badge>
  );
}
