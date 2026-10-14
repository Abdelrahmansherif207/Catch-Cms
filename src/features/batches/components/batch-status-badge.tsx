import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { BatchStatus } from '../types/batch.types';

interface BatchStatusBadgeProps {
  status: BatchStatus | string;
  className?: string;
}

type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

/** Five-state wave lifecycle — cancelled renders neutral, never red. */
const TONES: Record<BatchStatus, Tone> = {
  pending: 'warning',
  assigned: 'info',
  picking: 'info',
  completed: 'success',
  cancelled: 'muted',
};

const TONE_CLASSES: Record<Tone, string> = {
  success: 'border-transparent bg-success-soft text-success',
  warning: 'border-transparent bg-warning-soft text-warning',
  destructive: 'border-transparent bg-destructive-soft text-destructive',
  info: 'border-transparent bg-info-soft text-info',
  muted: 'border-transparent bg-muted text-muted-foreground',
};

export function BatchStatusBadge({ status, className }: BatchStatusBadgeProps) {
  const { t } = useTranslation();
  const tone = TONES[(status || 'pending') as BatchStatus] ?? 'muted';

  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone], className)}>
      {t('batches.status.' + status, { defaultValue: status })}
    </Badge>
  );
}
