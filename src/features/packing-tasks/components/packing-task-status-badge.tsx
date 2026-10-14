import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { PackingTaskStatus } from '../types/packing-task.types';

interface PackingTaskStatusBadgeProps {
  status: PackingTaskStatus | string;
  className?: string;
}

type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

/** Six-state pool mapped onto the five semantic soft tones. */
const TONES: Record<PackingTaskStatus, Tone> = {
  pending: 'warning',
  assigned: 'info',
  packing: 'info',
  packed: 'warning',
  verified: 'success',
  cancelled: 'destructive',
};

const TONE_CLASSES: Record<Tone, string> = {
  success: 'border-transparent bg-success-soft text-success',
  warning: 'border-transparent bg-warning-soft text-warning',
  destructive: 'border-transparent bg-destructive-soft text-destructive',
  info: 'border-transparent bg-info-soft text-info',
  muted: 'border-transparent bg-muted text-muted-foreground',
};

export function PackingTaskStatusBadge({
  status,
  className,
}: PackingTaskStatusBadgeProps) {
  const { t } = useTranslation();
  const tone = TONES[(status || 'pending') as PackingTaskStatus] ?? 'muted';

  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone], className)}>
      {t('packingTasks.status.' + status, { defaultValue: status })}
    </Badge>
  );
}
