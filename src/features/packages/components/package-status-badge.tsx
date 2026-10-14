import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { PackageStatus } from '../types/package.types';

interface PackageStatusBadgeProps {
  status: PackageStatus | string;
  className?: string;
}

type Tone = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

const TONES: Record<PackageStatus, Tone> = {
  open: 'info',
  sealed: 'success',
  voided: 'destructive',
  handed_off: 'muted',
};

const TONE_CLASSES: Record<Tone, string> = {
  success: 'border-transparent bg-success-soft text-success',
  warning: 'border-transparent bg-warning-soft text-warning',
  destructive: 'border-transparent bg-destructive-soft text-destructive',
  info: 'border-transparent bg-info-soft text-info',
  muted: 'border-transparent bg-muted text-muted-foreground',
};

export function PackageStatusBadge({ status, className }: PackageStatusBadgeProps) {
  const { t } = useTranslation();
  const tone = TONES[(status || 'open') as PackageStatus] ?? 'muted';

  return (
    <Badge variant="outline" className={cn('font-normal', TONE_CLASSES[tone], className)}>
      {t('packages.status.' + status, { defaultValue: status })}
    </Badge>
  );
}
